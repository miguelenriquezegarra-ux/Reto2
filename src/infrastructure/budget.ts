import { readFile,writeFile,rename } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { safePath } from './paths.js';
const reserveSchema=z.object({id:z.string(),amount:z.number().nonnegative(),session:z.string()});
const ledgerSchema=z.object({total:z.number().nonnegative(),sessions:z.record(z.string(),z.number().nonnegative()),reservations:z.record(z.string(),reserveSchema),input:z.number().nonnegative(),output:z.number().nonnegative(),calls:z.number().int().nonnegative(),blocked:z.boolean()});
type Ledger=z.infer<typeof ledgerSchema>;
const locks=new Map<string,Promise<unknown>>();
export class Budget {
 constructor(private root:string,private sessionLimit=1000000,private globalLimit=2000000,private callLimit=Number.POSITIVE_INFINITY){}
 private async update<T>(fn:(ledger:Ledger)=>T):Promise<T>{
  const run=async()=>{const p=await safePath(this.root,'out/usage.json',true);let ledger:Ledger;try{ledger=ledgerSchema.parse(JSON.parse(await readFile(p,'utf8')));}catch(e){if((e as NodeJS.ErrnoException).code!=='ENOENT')throw e;ledger={total:0,sessions:{},reservations:{},input:0,output:0,calls:0,blocked:false};}const result=fn(ledger);await writeFile(p+'.tmp',JSON.stringify(ledger,null,2));await rename(p+'.tmp',p);return result;};
  const task=(locks.get(this.root)??Promise.resolve()).then(run,run);locks.set(this.root,task.catch(()=>undefined));return task;
 }
 async reserve(session:string,amount:number){return this.update(ledger=>{if(!Number.isSafeInteger(amount)||amount<=0||ledger.blocked||ledger.calls>=this.callLimit||ledger.total+amount>this.globalLimit||(ledger.sessions[session]??0)+amount>this.sessionLimit)throw new Error('Límite de consumo alcanzado; no se llamó al modelo');const r={id:randomUUID(),session,amount};ledger.total+=amount;ledger.sessions[session]=(ledger.sessions[session]??0)+amount;ledger.reservations[r.id]=r;ledger.calls++;return r;});}
 async settle(r:z.infer<typeof reserveSchema>,input:number,output:number){let exceeded=false;await this.update(ledger=>{const reservation=ledger.reservations[r.id];if(!reservation)throw new Error('Reserva no encontrada');if(!Number.isSafeInteger(input)||!Number.isSafeInteger(output)||input<0||output<0)throw new Error('Usage inválido');const actual=input+output;ledger.total+=actual-reservation.amount;ledger.sessions[r.session]=(ledger.sessions[r.session]??0)+actual-reservation.amount;ledger.input+=input;ledger.output+=output;delete ledger.reservations[r.id];if(actual>reservation.amount){ledger.blocked=true;exceeded=true;}});if(exceeded)throw new Error('Límite: usage excedió reserva; modelo deshabilitado');}
}
