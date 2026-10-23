import type { LlmAdapter,ChatMessage,ToolDefinition,ModelResponse } from './adapter.js';
import type { Config } from '../config.js';
import type { Budget } from '../infrastructure/budget.js';
import { z } from 'zod';
const responseSchema=z.object({choices:z.array(z.object({message:z.object({content:z.string().nullable().optional(),tool_calls:z.array(z.object({id:z.string(),type:z.literal('function'),function:z.object({name:z.string(),arguments:z.string()})})).optional()})})).min(1),usage:z.object({prompt_tokens:z.number().int().nonnegative(),completion_tokens:z.number().int().nonnegative()})});
export class OpenAIAdapter implements LlmAdapter {
 constructor(private config:Config,private budget:Budget,private request:typeof fetch=fetch){}
 async enviar(messages:ChatMessage[],tools:ToolDefinition[],session:string,signal?:AbortSignal):Promise<ModelResponse>{
  if(!this.config.OPENAI_API_KEY)throw new Error('Proveedor no configurado; falta clave en el backend');
  if(messages.length>60||tools.length>5)throw new Error('Límite de contexto alcanzado; historial conservado');
  const reservation=await this.budget.reserve(session,Buffer.byteLength(JSON.stringify({messages,tools}),'utf8')+8192+this.config.LLM_MAX_COMPLETION_TOKENS);
  const requestSignal=signal?AbortSignal.any([signal,AbortSignal.timeout(this.config.LLM_TIMEOUT_MS)]):AbortSignal.timeout(this.config.LLM_TIMEOUT_MS);
  let response:Response;
  try{response=await this.request('https://api.openai.com/v1/chat/completions',{method:'POST',headers:{Authorization:`Bearer ${this.config.OPENAI_API_KEY}`,'Content-Type':'application/json'},signal:requestSignal,body:JSON.stringify({model:this.config.LLM_MODEL,messages,tools,tool_choice:'auto',parallel_tool_calls:false,max_completion_tokens:this.config.LLM_MAX_COMPLETION_TOKENS,reasoning_effort:'none'})});}
  catch{throw new Error(requestSignal.aborted?'Timeout del proveedor; sesión conservada':'Proveedor no disponible; sesión conservada');}
  if(!response.ok)throw new Error(`Proveedor no disponible (HTTP ${response.status}); sesión conservada`);
  const data=responseSchema.parse(await response.json());
  await this.budget.settle(reservation,data.usage.prompt_tokens,data.usage.completion_tokens);
  const message=data.choices[0]!.message;
  return {texto:message.content??'',toolCalls:(message.tool_calls??[]).map(call=>{let argumentos:unknown;try{argumentos=JSON.parse(call.function.arguments);}catch{argumentos=call.function.arguments;}return {id:call.id,nombre:call.function.name,argumentos};}),usage:{inputTokens:data.usage.prompt_tokens,outputTokens:data.usage.completion_tokens}};
 }
}
