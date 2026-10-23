import { z } from 'zod';
import type { Context } from './ports.js';
import { runtime } from './runtime.js';
import { safeError } from '../infrastructure/audit.js';
function tool<S extends z.ZodRawShape>(name:string,description:string,args:S,run:(args:z.infer<z.ZodObject<S>>,ctx:Context)=>Promise<unknown>){
 return {description,args,async execute(input:unknown,ctx:Context):Promise<string>{
  let ok=false;let result:unknown;let messageId:string|null=null;
  try{const value=z.strictObject(args).parse(input);if('mensaje_id' in value&&typeof value.mensaje_id==='string')messageId=value.mensaje_id;result={ok:true,data:await run(value,ctx)};ok=true;}
  catch(error){result={ok:false,error:safeError(error)};}
  try{await (await runtime(ctx)).audit.event(`contratos_${name}`,messageId,ok,ok?'Operación completada':'Operación rechazada');}catch{return JSON.stringify({ok:false,error:'No se pudo registrar evidencia de auditoría'});}
  return JSON.stringify(result);
 }};
}
// Cada historia añade su export público; el constructor no inicia servidor ni modelo.
export { tool as defineTool };
