export interface ToolDefinition {type:'function';function:{name:string;description:string;parameters:unknown;strict:false}}
export interface ChatMessage {role:'system'|'user'|'assistant'|'tool';content:string|null;tool_call_id?:string;tool_calls?:{id:string;type:'function';function:{name:string;arguments:string}}[]}
export interface ModelResponse {texto:string;toolCalls:{id:string;nombre:string;argumentos:unknown}[];usage:{inputTokens:number;outputTokens:number}}
export interface LlmAdapter {enviar(mensajes:ChatMessage[],herramientas:ToolDefinition[],sessionId:string,signal?:AbortSignal):Promise<ModelResponse>}
