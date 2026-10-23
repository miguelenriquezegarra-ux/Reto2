import { z } from 'zod';
const integer=(fallback:number)=>z.preprocess(v=>v===''||v===undefined?fallback:v,z.coerce.number().int().positive().finite());
const schema=z.object({PORT:integer(3000),OPENAI_API_KEY:z.string().default(''),LLM_MODEL:z.preprocess(v=>v||'gpt-5.4-mini-2026-03-17',z.string()),AGENT_MAX_ITERATIONS:integer(25),LLM_MAX_COMPLETION_TOKENS:integer(2048),SESSION_TOKEN_BUDGET:integer(1000000),GLOBAL_TOKEN_BUDGET:integer(2000000),LLM_TIMEOUT_MS:integer(30000),AGENT_TURN_TIMEOUT_MS:integer(120000),APP_TIMEZONE:z.preprocess(v=>v||'America/Bogota',z.string().refine(v=>{try{new Intl.DateTimeFormat('en',{timeZone:v});return true;}catch{return false;}}))});
export const loadConfig=(env:Record<string,string|undefined>=process.env)=>schema.parse(env);
export type Config=ReturnType<typeof loadConfig>;
