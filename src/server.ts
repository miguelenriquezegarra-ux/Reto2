import express from 'express';
import type { ErrorRequestHandler } from 'express';
import type { LlmAdapter } from './llm/adapter.js';
import { loadConfig,type Config } from './config.js';
import { Agent,HttpError } from './agent/loop.js';
import { configureRuntime } from './application/runtime.js';
import { OpenAIAdapter } from './llm/openai.js';
import { configuredBudget } from './infrastructure/configured-budget.js';
import { FileContractRepository } from './infrastructure/contracts-repository.js';
import { safeError } from './infrastructure/audit.js';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { z } from 'zod';
import { systemClock } from './infrastructure/clock.js';
export async function createApp(root:string,adapter:LlmAdapter,config:Config){
 await configureRuntime({directory:root,sessionId:'bootstrap'},{mode:'conversation',clock:systemClock(config.APP_TIMEZONE)});
 const app=express(),agent=new Agent(root,adapter,config);app.disable('x-powered-by');app.use(express.json({limit:'64kb'}));
 app.get('/api/health',(_req,res)=>{if(!config.OPENAI_API_KEY){res.status(503).json({ok:false,error:'Proveedor no configurado en backend'});return;}res.json({ok:true,provider:'openai',model:config.LLM_MODEL});});
 app.post('/api/chat',async(req,res)=>{res.json(await agent.chat(req.body as unknown));});
 app.get('/api/sessions/:id',(req,res)=>{const parsed=z.uuid().safeParse(req.params.id);if(!parsed.success)throw new HttpError(400,'Identificador de sesión inválido');const session=agent.sessions.get(parsed.data);if(!session)throw new HttpError(404,'Sesión no disponible');res.json(agent.view(session));});
 const errors:ErrorRequestHandler=(error:unknown,_req,res,_next)=>{const e=error as {status?:number;type?:string};const status=error instanceof HttpError?error.status:error instanceof z.ZodError?400:e.type==='entity.too.large'?413:e.type==='entity.parse.failed'?400:500;res.status(status).json({ok:false,error:status===500?'Operación no completada; revise diagnóstico del servidor':safeError(error)});};
 app.use(errors);return app;
}
export async function start(){const root=process.cwd(),config=loadConfig();const lock=new FileContractRepository(root);await lock.claimProcess();const budget=configuredBudget(root,config);const app=await createApp(root,new OpenAIAdapter(config,budget),config);app.use(express.static(resolve(root,'dist/web'),{dotfiles:'deny'}));return app.listen(config.PORT,'0.0.0.0',()=>console.log(`Servidor listo en puerto ${config.PORT}; no se verificó conectividad LLM`));}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href)await start();
