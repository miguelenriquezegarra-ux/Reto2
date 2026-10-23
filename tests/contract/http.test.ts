import { it,expect } from 'vitest';
import { createApp } from '../../src/server.js';
import { ScriptedAdapter } from '../support/llm-adapter.js';
import { workspace } from '../support/workspace.js';
import { loadConfig } from '../../src/config.js';
it('serves health, chat and history, rejects invalid and unknown sessions',async()=>{const w=await workspace(),app=await createApp(w.ctx.directory,new ScriptedAdapter([]),loadConfig({OPENAI_API_KEY:'fake'}));const server=app.listen(0,'127.0.0.1');await new Promise<void>(r=>server.once('listening',r));const address=server.address();if(!address||typeof address==='string')throw new Error('address');const base=`http://127.0.0.1:${address.port}`;
 try{expect((await fetch(base+'/api/health')).status).toBe(200);const a=await fetch(base+'/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({message:'hola'})});expect(a.status).toBe(200);const result=await a.json() as {sessionId:string};expect((await fetch(base+'/api/sessions/'+result.sessionId)).status).toBe(200);expect((await fetch(base+'/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'})).status).toBe(400);expect((await fetch(base+'/out/log.jsonl')).status).toBe(404);}finally{await new Promise<void>(r=>server.close(()=>r()));await w.dispose();}});
