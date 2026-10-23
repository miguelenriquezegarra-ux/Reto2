import { loadEnvFile } from 'node:process';
import { createServer } from 'vite';
import { FileContractRepository } from '../src/infrastructure/contracts-repository.js';
import { createApp } from '../src/server.js';
import { loadConfig } from '../src/config.js';
import { OpenAIAdapter } from '../src/llm/openai.js';
import { configuredBudget } from '../src/infrastructure/configured-budget.js';
try{loadEnvFile('.env');}catch(error){if((error as NodeJS.ErrnoException).code!=='ENOENT')throw error;}
const root=process.cwd(),config=loadConfig();await new FileContractRepository(root).claimProcess();
const app=await createApp(root,new OpenAIAdapter(config,configuredBudget(root,config)),config);
const vite=await createServer({server:{middlewareMode:true},appType:'spa'});app.use(vite.middlewares);
app.listen(config.PORT,'0.0.0.0',()=>console.log(`Chat http://localhost:${config.PORT}`));
