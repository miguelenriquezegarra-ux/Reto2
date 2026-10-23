import { rowSchema,columns,type Extraction,type Row } from '../domain/schemas.js';
import { validate } from '../domain/validate.js';
import { normalize } from '../domain/parsers.js';
import { canonicalCandidate } from './validar.js';
import { runtime } from './runtime.js';
import { candidateHash } from './confirmation.js';
import type { Context } from './ports.js';
import { hash,encodeRows,optionalText } from '../infrastructure/contracts-repository.js';
import { FileMailboxRepository } from '../infrastructure/mailbox-repository.js';
import { randomUUID } from 'node:crypto';
export async function registerMessage(id:string,input:Extraction,confirmed:boolean,ctx:Context){const rt=await runtime(ctx);return rt.repo.exclusive(async()=>{
 const box=new FileMailboxRepository(ctx.directory),source=await box.document(await box.load(id)),sourceHash=hash(source.text),processed=await rt.repo.processed();
 const old=processed[id] as {sourceHash?:string;receipt?:{id_contrato:string;accion:string;ruta_archivo:string};candidateHash?:string}|undefined;
 if(old){if(old.sourceHash!==sourceHash)throw new Error('Conflicto: fuente procesada cambió');if(old.receipt){if(old.candidateHash!==candidateHash(input))throw new Error('Conflicto: candidato procesado cambió');return old.receipt;}throw new Error('Mensaje ya cerrado sin registro contractual');}
 const rows=await rt.repo.rows();const v=validate(await canonicalCandidate(id,input,ctx),rows);
 let candidate=v.candidato;
 if(v.clasificacion==='duplicado'||v.clasificacion==='rechazado')throw new Error(`No registrable: ${v.clasificacion}`);
 if(v.requiere_revision.length){
  if(!confirmed)throw new Error(`requiere revisión: ${v.requiere_revision.join(', ')}`);
  if(rt.policy.mode==='conversation'){
   const permission=rt.policy.grants.get(id);
   if(!permission||permission.revision!==hash(rows)||candidateHash(permission.candidate)!==candidateHash(input))throw new Error('requiere revisión: confirmación humana válida del candidato');
   candidate=permission.candidate;
  }
 }
 const previous=rows.find(r=>r.id_contrato===v.id_contrato_existente);
 if(v.clasificacion==='actualizacion'&&!previous)throw new Error('requiere revisión: contrato existente no identificado');
 const contractId=candidate.id_contrato??`AUTO-${candidate.fecha_inicio?.slice(0,4)}-${1+Math.max(0,...rows.filter(r=>r.id_contrato.startsWith(`AUTO-${candidate.fecha_inicio?.slice(0,4)}-`)).map(r=>Number(r.id_contrato.split('-').at(-1))||0))}`;
 if(!/^[A-Za-z0-9_-]+$/.test(contractId))throw new Error('Identificador no autorizado para archivo');
 const slug=normalize(candidate.cliente??'').replaceAll(' ','-');
 const archive=`Contratos/${candidate.fecha_inicio?.slice(0,4)}/${slug}/${contractId}.${source.filename.split('.').at(-1)}`;
 const raw=Object.fromEntries(columns.map(k=>[k,candidate[k]]));
 const row=rowSchema.parse({...raw,id_contrato:previous?.id_contrato??contractId,comercial:candidate.comercial??'',ruta_sharepoint:archive,fecha_registro:previous?.fecha_registro??rt.clock.today(),fuente:previous?.fuente??'buzon'});
 if(previous)rows[rows.indexOf(previous)]=row;else rows.push(row);
 const receipt={id_contrato:row.id_contrato,accion:v.clasificacion,ruta_archivo:archive};
 processed[id]={clasificacion:v.clasificacion,sourceHash,candidateHash:candidateHash(input),receipt};
 const changes=Object.fromEntries(columns.filter(k=>previous?.[k]!==row[k]).map(k=>[k,{antes:previous?.[k]??null,despues:row[k]}]));
 const event={ts:rt.clock.now().toISOString(),id_contrato:row.id_contrato,accion:v.clasificacion,cambios:changes,mensaje_id:id,correlationId:randomUUID()};
 const history=await optionalText(await rt.repo.path('out/sharepoint/historial.jsonl'));
 const audit=await optionalText(await rt.repo.path('out/log.jsonl'));
 await rt.repo.transactions.commit({[`out/sharepoint/${archive}`]:source.text,'out/sharepoint/maestro-contratos.csv':encodeRows(rows),'out/sharepoint/historial.jsonl':history+JSON.stringify(event)+'\n','out/procesados.json':JSON.stringify(processed,null,2),'out/log.jsonl':audit+JSON.stringify({ts:event.ts,herramienta:'contratos_registrar',mensaje_id:id,ok:true,resumen:'Commit contractual',correlationId:event.correlationId,id_contrato:row.id_contrato})+'\n'});
 rt.policy.grants.delete(id);return receipt;
});}
