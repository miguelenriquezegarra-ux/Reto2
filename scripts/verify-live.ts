import { readFile,writeFile,mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import assert from 'node:assert/strict';
import { inspectState } from './inspect-state.js';
// Operator-only. Requires access to the SAME evaluation server volume; never an administrative HTTP endpoint.
export async function verifyLive(){
 if(process.env.RUN_LIVE!=='1')throw new Error('Live deshabilitado; requiere autorización explícita RUN_LIVE=1');
 assert.equal(process.env.LIVE_CHECK_MODE,'1','Arrancar servidor y operador con LIVE_CHECK_MODE=1');assert.ok(process.env.SOURCE_REVISION,'Falta revisión fuente');assert.equal(process.env.LIVE_TARIFF_REVIEWED,'1','Revalidar tarifa máxima USD4.50/M con documentación oficial antes del check');
 const url=new URL(process.env.LIVE_URL??'');assert.equal(url.protocol,'https:');const root=process.env.LIVE_STATE_ROOT;assert.ok(root,'Falta volumen del servidor LIVE_STATE_ROOT');
 const read=(p:string)=>readFile(resolve(root,'out',p),'utf8');const ledger=JSON.parse(await read('usage.json').catch(e=>{if((e as NodeJS.ErrnoException).code==='ENOENT')return '{"total":0,"calls":0}';throw e;})) as {total:number;calls:number};
 assert.ok(ledger.total===0&&ledger.calls===0,'Usar estado de evaluación sin consumo anterior; no resetear instancia pública');
 const attemptPath=resolve(root,'out/live-attempts.json');const prior=JSON.parse(await readFile(attemptPath,'utf8').catch(e=>{if((e as NodeJS.ErrnoException).code==='ENOENT')return '{"attempts":0}';throw e;})) as {attempts:number};assert.ok(prior.attempts<2);await mkdir(resolve(root,'out'),{recursive:true});await writeFile(attemptPath,JSON.stringify({attempts:prior.attempts+1}));
 const health=await fetch(new URL('/api/health',url));assert.ok(health.ok);const configuration=await health.json() as unknown;
 interface Turn {sessionId:string;status:string;reply:string;needsConfirmation:boolean;toolCalls:{name:string;ok:boolean;resultSummary:string}[];pending?:{id:string;mensaje_id:string;candidate:Record<string,unknown>;fields:string[]}}
 const chat=async(body:unknown):Promise<Turn>=>{const response=await fetch(new URL('/api/chat',url),{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body),signal:AbortSignal.timeout(125000)});assert.ok(response.ok);const turn=await response.json() as Turn;assert.ok(!['provider_error','limited'].includes(turn.status));return turn;};
 let turn=await chat({message:'Procesa los seis mensajes del buzón con fecha de hoy 2026-09-03, registra lo limpio y muestra clasificación, pendientes y alertas. No registres nada dudoso sin preguntarme.'});assert.ok(turn.toolCalls.length>0&&turn.needsConfirmation);
 const calls=[...turn.toolCalls];
 for(let i=0;turn.pending&&i<3;i++){
  const p=turn.pending;const fields:Record<string,unknown>=Object.fromEntries(p.fields.map(k=>[k,p.candidate[k]]));
  if(p.mensaje_id==='msg-006'){
   turn=await chat({sessionId:turn.sessionId,message:'confirmo el valor 0 y la fecha fin 2027-08-31'});assert.ok(turn.needsConfirmation);assert.ok(turn.pending?.candidate.fecha_inicio===null);
   Object.assign(fields,{fecha_inicio:'2026-08-01',fecha_fin:'2027-08-31',valor:0,moneda:'COP',requiere_poliza:false,tipo_poliza:'',estado_poliza:'no_aplica'});
  }
  turn=await chat({sessionId:turn.sessionId,message:'Confirmo estos datos humanos de evaluación, incluida la decisión de póliza',humanAction:{pendingId:turn.pending!.id,kind:'confirm',fields}});calls.push(...turn.toolCalls);
 }
 assert.ok(!turn.needsConfirmation);
 // Human-only turns do not consume model tokens. One bounded model turn (25 calls maximum).
 const state=await inspectState(root);assert.equal(state.rows,11);assert.equal(state.uniqueIds,11);assert.equal(state.historyEntries,4);assert.equal(Object.keys(state.processed as object).length,6);assert.equal(state.journals,0);assert.ok(state.usage&&!state.usage.blocked&&state.usage.total<=1000000&&state.usage.calls<=40);assert.ok(state.usage.total*4.5/1000000<=5,'Revalidar tarifa máxima antes del release');
 assert.equal(state.archiveProof.length,4);assert.ok(state.archiveProof.every(p=>p.hashMatches));assert.ok(state.alerts.includes('CT-2026-004')&&state.alerts.includes('CT-2026-009')&&state.alerts.includes('CM-2026-03'));
 const update=state.contracts.find(r=>r.id==='CT-2026-011');assert.equal(update?.valor,520000);assert.equal(update?.fin,'2027-11-01');assert.equal(update?.registro,'2026-05-05');
 const evidence={verifiedAt:new Date().toISOString(),url:url.origin,configuration,state,calls,sourceRevision:process.env.SOURCE_REVISION??'NO REGISTRADA',costBasis:'Tarifa máxima del Plan USD4.50/M; requiere revalidación oficial antes de ejecutar'};
 await mkdir(resolve(root,'out/evidence'),{recursive:true});await writeFile(resolve(root,'out/evidence/live.json'),JSON.stringify(evidence,null,2));return evidence;
}
if(process.argv[1]?.endsWith('verify-live.ts')){await verifyLive();console.log('Verificación HTTP/estado completada; revisar además navegador, tarifas y revisión fuente.');}
