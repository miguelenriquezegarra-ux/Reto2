import { readFile,writeFile,rename,open } from 'node:fs/promises';
import { parse } from 'csv-parse/sync';
import { stringify } from 'csv-stringify/sync';
import { createHash } from 'node:crypto';
import { z } from 'zod';
import { columns,rowSchema,type Row } from '../domain/schemas.js';
import { safePath } from './paths.js';
import { Transactions } from './transaction.js';
export const hash=(v:unknown)=>createHash('sha256').update(typeof v==='string'?v:JSON.stringify(v)).digest('hex');
export async function optionalText(path:string):Promise<string>{try{return await readFile(path,'utf8');}catch(error){if((error as NodeJS.ErrnoException).code==='ENOENT')return '';throw error;}}
export const encodeRows=(rows:Row[])=>stringify(rows.map(r=>({...r,requiere_poliza:String(r.requiere_poliza)})),{header:true,columns});
export function decodeRows(text:string):Row[]{
  const raw:unknown=parse(text,{columns:true,skip_empty_lines:true});
  return z.array(z.record(z.string(),z.string())).parse(raw).map(v=>rowSchema.parse({...v,valor:Number(v.valor),requiere_poliza:v.requiere_poliza==='true'}));
}
export class FileContractRepository {
  readonly transactions:Transactions;
  private tail:Promise<unknown>=Promise.resolve();
  constructor(readonly root:string){this.transactions=new Transactions(root);}
  async exclusive<T>(fn:()=>Promise<T>):Promise<T>{const next=this.tail.then(fn,fn);this.tail=next.catch(()=>undefined);return next;}
  async path(path:string):Promise<string>{return safePath(this.root,path,true);}
  async initialize():Promise<void>{await this.exclusive(async()=>{await this.transactions.recover();const p=await this.path('out/sharepoint/maestro-contratos.csv');if(!await optionalText(p)){const seed=await readFile(await safePath(this.root,'fixtures/reto-02/maestro-contratos.csv'),'utf8');decodeRows(seed);await this.atomic('out/sharepoint/maestro-contratos.csv',seed);}});}
  async claimProcess():Promise<void>{const p=await this.path('out/.writer.lock');try{const file=await open(p,'wx');await file.writeFile(String(process.pid));await file.close();}catch(e){if((e as NodeJS.ErrnoException).code!=='EEXIST')throw e;const pid=Number(await readFile(p,'utf8'));let alive=true;try{process.kill(pid,0);}catch{alive=false;}if(alive)throw new Error('Ya existe un escritor del estado');await this.atomic('out/.writer.lock',String(process.pid));}}
  async atomic(path:string,text:string):Promise<void>{const p=await this.path(path);await writeFile(p+'.tmp',text);await rename(p+'.tmp',p);}
  async rows():Promise<Row[]>{if(this.transactions.blocked)throw new Error('Estado requiere recuperación');return decodeRows(await readFile(await this.path('out/sharepoint/maestro-contratos.csv'),'utf8'));}
  async processed():Promise<Record<string,unknown>>{return z.record(z.string(),z.unknown()).parse(JSON.parse(await optionalText(await this.path('out/procesados.json'))||'{}'));}
  async close(id:string,classification:string,sourceHash:string,motivo?:string):Promise<void>{const p=await this.processed();p[id]={clasificacion:classification,sourceHash,motivo};await this.transactions.commit({'out/procesados.json':JSON.stringify(p,null,2)});}
  async revision():Promise<string>{return hash(await this.rows());}
}
