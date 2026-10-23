import { mkdir,readFile,writeFile,rename,unlink,readdir,open } from 'node:fs/promises';
import { dirname } from 'node:path';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { safePath } from './paths.js';
const journalSchema=z.object({committed:z.boolean(),before:z.record(z.string(),z.string().nullable()),after:z.record(z.string(),z.string().nullable())});
async function content(path:string){try{return await readFile(path,'utf8');}catch(e){if((e as NodeJS.ErrnoException).code==='ENOENT')return null;throw e;}}
async function durable(path:string,text:string){await mkdir(dirname(path),{recursive:true});const file=await open(path,'w');try{await file.writeFile(text);await file.sync();}finally{await file.close();}}
async function publish(root:string,path:string,text:string|null){if(!path.startsWith('out/'))throw new Error('Destino de transacción inválido');const target=await safePath(root,path,true);if(text===null){await unlink(target).catch(e=>{if((e as NodeJS.ErrnoException).code!=='ENOENT')throw e;});return;}await durable(target+'.tmp',text);await rename(target+'.tmp',target);}
export class Transactions {
 blocked=false;
 fault:((phase:string)=>void)|undefined;
 constructor(private root:string){}
 async recover():Promise<void>{
  const dir=await safePath(this.root,'out/.transactions',true);await mkdir(dir,{recursive:true});
  for(const name of (await readdir(dir)).filter(n=>n.endsWith('.json'))){const path=await safePath(this.root,`out/.transactions/${name}`);const entry=journalSchema.parse(JSON.parse(await readFile(path,'utf8')));for(const [file,text]of Object.entries(entry.committed?entry.after:entry.before))await publish(this.root,file,text);await unlink(path);}
  this.blocked=false;
 }
 async commit(after:Record<string,string|null>):Promise<void>{
  if(this.blocked)throw new Error('Estado bloqueado: recuperación requerida');
  const before:Record<string,string|null>={};for(const path of Object.keys(after))before[path]=await content(await safePath(this.root,path,true));
  const journal=await safePath(this.root,`out/.transactions/${randomUUID()}.json`,true),entry={committed:false,before,after};
  await durable(journal,JSON.stringify(entry));
  try{
   for(const [path,text]of Object.entries(after)){this.fault?.(`before:${path}`);await publish(this.root,path,text);this.fault?.(`after:${path}`);}
   entry.committed=true;await durable(journal+'.tmp',JSON.stringify(entry));await rename(journal+'.tmp',journal);this.fault?.('committed');await unlink(journal);
  }catch(error){if(!entry.committed){try{for(const [path,text]of Object.entries(before))await publish(this.root,path,text);await unlink(journal);}catch{this.blocked=true;throw new Error('Recuperación requerida antes de continuar');}}throw error;}
 }
}
