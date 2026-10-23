import { appendFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import type { Clock } from '../application/ports.js';
import { safePath } from './paths.js';
export function redact(text:string):string {return text.replace(/sk-[\w-]+/g,'[REDACTED]').replace(/Bearer\s+\S+/gi,'Bearer [REDACTED]');}
export function safeError(error:unknown):string {
  if(error instanceof Error && (error.name==='ZodError'))return 'Datos inválidos: revisar campos, fechas y moneda';
  const code=(error as NodeJS.ErrnoException)?.code;
  if(code)return 'Error de archivo: operación no completada; revise el estado del servidor';
  return redact(error instanceof Error?error.message:'Operación no completada');
}
export class Audit {
  constructor(private root:string,private clock:Clock){}
  async event(herramienta:string,mensaje_id:string|null,ok:boolean,resumen:string):Promise<void>{
    const path=await safePath(this.root,'out/log.jsonl',true);
    await appendFile(path,JSON.stringify({ts:this.clock.now().toISOString(),herramienta,mensaje_id,ok,resumen:redact(resumen),correlationId:randomUUID()})+'\n');
  }
}
