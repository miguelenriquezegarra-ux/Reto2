import type { Context } from './ports.js';
import { runtime } from './runtime.js';
import { FileMailboxRepository } from '../infrastructure/mailbox-repository.js';
import { documentKind } from '../domain/document-kind.js';
import { hash } from '../infrastructure/contracts-repository.js';
export async function readMailbox(ctx:Context){const rt=await runtime(ctx),box=new FileMailboxRepository(ctx.directory);return rt.repo.exclusive(async()=>{
 const done=await rt.repo.processed(),messages=[];
 for(const m of await box.list()) {if(done[m.id])continue;let data:{text:string;filename:string};try{data=await box.document(m);}catch{messages.push({...m,tiene_contrato:false,error:'Adjunto ilegible; mensaje abierto'});continue;}
  const tiene_contrato=documentKind(data.text)!=='rechazado';
  const {id,de,asunto,fecha,adjuntos}=m;
  messages.push({id,de,asunto,fecha,adjuntos,tiene_contrato,...(!tiene_contrato?{clasificacion:'rechazado',motivo:'Sin adjunto de contrato identificable'}:{})});
  if(!tiene_contrato)await rt.repo.close(id,'rechazado',hash(data.text),'Sin adjunto de contrato identificable');
 }
 return {mensajes:messages};
});}
