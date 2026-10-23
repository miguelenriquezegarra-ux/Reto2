import assert from 'node:assert/strict';
import { readFile,rm } from 'node:fs/promises';
import { resolve } from 'node:path';
import { configureRuntime } from './src/application/runtime.js';
import { fixedClock } from './src/infrastructure/clock.js';
import { leer_buzon,extraer,validar,registrar,alertas } from './src/tools/contratos.js';
import { extractionSchema,type Extraction } from './src/domain/schemas.js';
import { humanExample } from './tests/support/human-inputs.js';
const directory=process.cwd(),out=resolve(directory,'out');
assert.equal(out,resolve(directory,'out'));
try{const pid=Number(await readFile(resolve(out,'.writer.lock'),'utf8'));let alive=false;try{process.kill(pid,0);alive=true;}catch{/* escritor anterior terminado */}if(alive)throw new Error('No limpiar out: servidor activo');}catch(e){if((e as NodeJS.ErrnoException).code!=='ENOENT')throw e;}
await rm(out,{recursive:true,force:true});
const ctx={directory,sessionId:'demo'},rt=await configureRuntime(ctx,{clock:fixedClock(),mode:'direct'});
const unpack=(text:string)=>{const result=JSON.parse(text) as {ok:boolean;data:unknown;error?:string};assert.equal(result.ok,true,result.error);return result.data;};
const inbox=unpack(await leer_buzon.execute({},ctx)) as {mensajes:{id:string;tiene_contrato:boolean}[]};assert.equal(inbox.mensajes.length,6);
const pending:{id:string;contrato:Extraction}[]=[];
for(const message of inbox.mensajes){
 if(!message.tiene_contrato){console.log(`${message.id}: rechazado | sin registro`);continue;}
 const contrato=extractionSchema.parse(unpack(await extraer.execute({mensaje_id:message.id},ctx)));
 const result=unpack(await validar.execute({mensaje_id:message.id,contrato},ctx)) as {clasificacion:string;requiere_revision:string[]};
 let action='sin escritura contractual';
 if(result.clasificacion!=='duplicado'){
  if(result.requiere_revision.length){const denied=JSON.parse(await registrar.execute({mensaje_id:message.id,contrato},ctx));assert.equal(denied.ok,false);pending.push({id:message.id,contrato});action='pendiente humano';}
  else{unpack(await registrar.execute({mensaje_id:message.id,contrato},ctx));action='registrado';}
 }
 console.log(`${message.id}: ${result.clasificacion} | revisión=${result.requiere_revision.join(',')} | ${action}`);
}
assert.equal((await rt.repo.rows()).length,10);
for(const p of pending){if(p.contrato.condicion_poliza){Object.assign(p.contrato,humanExample);console.log('Entrada HUMANA simulada de demostración: '+JSON.stringify(humanExample));}unpack(await registrar.execute({mensaje_id:p.id,contrato:p.contrato,confirmado:true},ctx));console.log(`${p.id}: segunda llamada confirmado=true | registrado`);}
const rows=await rt.repo.rows();assert.equal(rows.length,11);assert.equal(new Set(rows.map(r=>r.id_contrato)).size,11);
assert.equal(rows.find(r=>r.id_contrato==='CT-2026-011')?.fecha_fin,'2027-11-01');
const report=unpack(await alertas.execute({hoy:'2026-09-03'},ctx)) as {vencen:{id_contrato:string}[]};assert.deepEqual(report.vencen.map(r=>r.id_contrato).sort(),['CT-2026-004','CT-2026-009']);
console.log('Verificación completada: 11 contratos, seis mensajes, cero duplicados. Reporte out/alertas.md');
