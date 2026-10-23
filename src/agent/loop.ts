import type { LlmAdapter,ToolDefinition } from '../llm/adapter.js';
import type { Config } from '../config.js';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import * as tools from '../tools/contratos.js';
import { columns,extractionSchema } from '../domain/schemas.js';
import type { Validation } from '../domain/validate.js';
import { configureRuntime,runtime } from '../application/runtime.js';
import { validateMessage } from '../application/validar.js';
import { correction,grant } from '../application/confirmation.js';
import { safeError,redact } from '../infrastructure/audit.js';
import { Sessions,type Session,type CallView } from './sessions.js';
import { present } from './presenter.js';
import { systemClock } from '../infrastructure/clock.js';
export const requestSchema=z.strictObject({sessionId:z.uuid().optional(),message:z.string().trim().min(1).max(12000),humanAction:z.strictObject({pendingId:z.uuid(),kind:z.enum(['confirm','correct']),fields:z.record(z.string(),z.unknown()).optional()}).optional()});
export class HttpError extends Error {constructor(readonly status:number,message:string){super(message);}}
const toolMap=Object.fromEntries(Object.entries(tools).map(([name,tool])=>[`contratos_${name}`,tool]));
export const toolDefinitions:ToolDefinition[]=Object.entries(tools).map(([name,tool])=>({type:'function',function:{name:`contratos_${name}`,description:tool.description,parameters:z.toJSONSchema(z.strictObject(tool.args)),strict:false}}));
export class Agent {
 readonly sessions=new Sessions();
 constructor(private root:string,private adapter:LlmAdapter,private config:Config){}
 private clean<T>(value:T):T {let text=JSON.stringify(value);if(this.config.OPENAI_API_KEY)text=text.replaceAll(this.config.OPENAI_API_KEY,'[REDACTED]');return JSON.parse(redact(text)) as T;}
 view(s:Session){return this.clean({sessionId:s.id,messages:s.messages,needsConfirmation:s.pending.length>0,pending:s.pending.map(({id,mensaje_id,fields,candidate})=>({id,mensaje_id,fields,candidate})),status:s.status});}
 private async execute(s:Session,name:string,args:unknown,calls:CallView[],id:string=randomUUID()):Promise<{ok:boolean;data?:unknown;error?:string}>{
  const tool=toolMap[name],ctx={directory:this.root,sessionId:s.id};
  const raw=tool?await tool.execute(args,ctx):JSON.stringify({ok:false,error:'Herramienta no autorizada'});
  const result=JSON.parse(raw) as {ok:boolean;data?:unknown;error?:string};
  if(!tool)await (await runtime(ctx)).audit.event(name,null,false,'Herramienta no autorizada');
  const summary=result.ok?JSON.stringify(result.data):result.error??'Error de herramienta';calls.push(this.clean({id,name,args,resultSummary:summary,ok:result.ok}));
  if(name==='contratos_validar'&&result.ok){const data=result.data as Validation;const messageId=(args as {mensaje_id:string}).mensaje_id;
   s.pending=s.pending.filter(p=>p.mensaje_id!==messageId);
   if(data.requiere_revision.length)s.pending.push({id:randomUUID(),mensaje_id:messageId,fields:data.requiere_revision,candidate:data.candidato,revision:await (await runtime(ctx)).repo.revision(),turn:s.turn});
  }
  if(name==='contratos_registrar'&&result.ok)s.pending=s.pending.filter(p=>p.mensaje_id!==(args as {mensaje_id:string}).mensaje_id);
  if(name==='contratos_alertas'&&result.ok)s.alertDate=(args as {hoy:string}).hoy;
  return result;
 }
 async chat(input:unknown){const request=requestSchema.parse(input);const s=request.sessionId?this.sessions.get(request.sessionId):this.sessions.create();if(!s)throw new HttpError(404,'Sesión no disponible; puede iniciar una nueva');if(s.running)throw new HttpError(409,'Turno en curso');s.running=true;s.turn++;
  const ctx={directory:this.root,sessionId:s.id};let rt=await runtime(ctx);if(rt.policy.mode!=='conversation')rt=await configureRuntime(ctx,{mode:'conversation',clock:systemClock(this.config.APP_TIMEZONE)});
  const calls:CallView[]=[];let reason:string|undefined;s.status='completed';s.messages.push({role:'user',content:this.clean(request.message)});
  try{
   let action=request.humanAction;
   if(!action&&s.pending.length&&/^confirmo\b/i.test(request.message)){
    const fields:Record<string,unknown>={};const value=request.message.match(/valor\s+(\d+(?:\.\d+)?)/i)?.[1];const end=request.message.match(/fecha\s+fin\s+(\d{4}-\d{2}-\d{2})/i)?.[1];if(value)fields.valor=Number(value);if(end)fields.fecha_fin=end;
    action={pendingId:s.pending[0]!.id,kind:'confirm',fields};
   }
   if(action){const p=s.pending.find(p=>p.id===action.pendingId);if(!p||p.turn!==s.turn-1)throw new HttpError(400,'Confirmación no corresponde al siguiente turno pendiente');
    if(Object.keys(action.fields??{}).some(key=>!p.fields.includes(key)))throw new HttpError(400,'Solo puede precisar los campos de revisión mostrados');
    const candidate=correction(p.candidate,action.fields??{}),v=await validateMessage(p.mensaje_id,candidate,ctx);
    const missing=columns.filter(k=>!['id_contrato','comercial','ruta_sharepoint','fecha_registro','fuente'].includes(k)&&v.candidato[k]===null);
    const revision=await rt.repo.revision();
    if(missing.length||action.kind==='correct'||revision!==p.revision){p.candidate=v.candidato;p.fields=[...new Set([...v.requiere_revision,...missing])];p.revision=revision;s.status='awaiting_confirmation';reason=missing.length?'Faltan datos precisos; confirmación parcial conservada.':'Candidato actualizado; confirme los valores mostrados.';}
    else {grant(rt,p.mensaje_id,v.candidato,revision);const registered=await this.execute(s,'contratos_registrar',{mensaje_id:p.mensaje_id,contrato:v.candidato,confirmado:true},calls);if(registered.ok&&s.alertDate)await this.execute(s,'contratos_alertas',{hoy:s.alertDate},calls);}
    s.context.push({role:'user',content:request.message});
    for(const call of calls){s.context.push({role:'assistant',content:null,tool_calls:[{id:call.id,type:'function',function:{name:call.name,arguments:JSON.stringify(call.args)}}]},{role:'tool',tool_call_id:call.id,content:call.resultSummary});}
   }else{
    if(s.context.length===0){const prompt=await readFile(resolve(this.root,'agent/prompt.md'),'utf8'),knowledge=await readFile(resolve(this.root,'src/knowledge/registro-contratos.md'),'utf8');s.context.push({role:'system',content:prompt+'\n'+knowledge});}
    s.context.push({role:'user',content:request.message});
    const timeout=AbortSignal.timeout(this.config.AGENT_TURN_TIMEOUT_MS);let completed=false;
    for(let round=0;round<this.config.AGENT_MAX_ITERATIONS;round++){
     if(timeout.aborted)throw new Error('Timeout de turno; trabajo previo conservado');
     const response=await this.adapter.enviar(s.context,toolDefinitions,s.id,timeout);
     if(!response.toolCalls.length){completed=true;break;}
     s.context.push({role:'assistant',content:null,tool_calls:response.toolCalls.map(c=>({id:c.id,type:'function',function:{name:c.nombre,arguments:typeof c.argumentos==='string'?c.argumentos:JSON.stringify(c.argumentos)}}))});
     for(const call of response.toolCalls){const result=await this.execute(s,call.nombre,call.argumentos,calls,call.id);s.context.push({role:'tool',tool_call_id:call.id,content:JSON.stringify(result)});}
    }
    if(!completed){s.status='limited';reason='Límite de iteraciones alcanzado; revise lo realizado y lo pendiente.';}
   }
  }catch(error){if(error instanceof HttpError){for(const p of s.pending)p.turn=s.turn;throw error;}s.status=/[Ll]ímite/.test(safeError(error))?'limited':'provider_error';reason=safeError(error);}
  finally{s.running=false;}
  if(s.pending.length&&s.status==='completed')s.status='awaiting_confirmation';for(const p of s.pending)p.turn=s.turn;
  const reply=this.clean(present(calls,s.pending,reason));s.messages.push({role:'assistant',content:reply,toolCalls:calls});
  return this.clean({sessionId:s.id,reply,toolCalls:calls,needsConfirmation:s.pending.length>0,pending:s.pending[0]?{id:s.pending[0].id,mensaje_id:s.pending[0].mensaje_id,fields:s.pending[0].fields,candidate:s.pending[0].candidate}:undefined,status:s.status});
 }
}
