import { readFile } from 'node:fs/promises';
import { catalogSchema,columns,extractionSchema,type Extraction } from '../domain/schemas.js';
import { validate } from '../domain/validate.js';
import { FileMailboxRepository } from '../infrastructure/mailbox-repository.js';
import { hash } from '../infrastructure/contracts-repository.js';
import { safePath } from '../infrastructure/paths.js';
import { extract } from '../domain/extract.js';
import { runtime } from './runtime.js';
import type { Context } from './ports.js';
export async function canonicalCandidate(id:string,input:Extraction,ctx:Context):Promise<Extraction>{
 const box=new FileMailboxRepository(ctx.directory),message=await box.load(id),base=extract((await box.document(message)).text);
 const catalog=catalogSchema.parse(JSON.parse(await readFile(await safePath(ctx.directory,'fixtures/reto-02/comerciales.json'),'utf8')));
 base.comercial=catalog.find(r=>r.email.toLowerCase()===message.de.toLowerCase())?.nombre??'';
 base.evidencia.comercial={texto:base.comercial?'Catálogo comercial':'Remitente desconocido; no bloqueante',origen:'catálogo'};
 // Las diferencias de args son propuestas, nunca evidencia humana por afirmación del modelo.
 for(const field of columns){if(['comercial','fuente','ruta_sharepoint','fecha_registro','id_contrato'].includes(field))continue;if(input[field]!==base[field]){Object.assign(base,{[field]:input[field]});base.confianza[field]=0.5;base.evidencia[field]={texto:'Propuesta pendiente de autorización',origen:'derivación'};}}
 return extractionSchema.parse(base);
}
export async function validateMessage(id:string,input:Extraction,ctx:Context){const rt=await runtime(ctx);return rt.repo.exclusive(async()=>{
 const candidate=await canonicalCandidate(id,input,ctx),result=validate(candidate,await rt.repo.rows());
 if(result.clasificacion==='duplicado'){const box=new FileMailboxRepository(ctx.directory);await rt.repo.close(id,'duplicado',hash((await box.document(await box.load(id))).text));}
 return result;
});}
