import { it,expect } from 'vitest';
import { createApp } from '../../src/server.js';
import { loadConfig } from '../../src/config.js';
import { ScriptedAdapter } from '../support/llm-adapter.js';
import { workspace } from '../support/workspace.js';
it('isolates HTTP state and secrets, rejects excess bodies and untrusted tool names',async()=>{
 const w=await workspace();const secret='sk-security-test-do-not-expose';const app=await createApp(w.ctx.directory,new ScriptedAdapter([{texto:secret,toolCalls:[{id:'bad',nombre:'shell',argumentos:{command:'read .env'}}],usage:{inputTokens:0,outputTokens:0}}]),loadConfig({OPENAI_API_KEY:secret}));
 const server=app.listen(0,'127.0.0.1');await new Promise<void>(r=>server.once('listening',r));const address=server.address();if(!address||typeof address==='string')throw new Error('No address');const base=`http://127.0.0.1:${address.port}`;
 try{
  for(const path of ['/out/maestro-contratos.csv','/.env','/fixtures/reto-02/comerciales.json','/src/config.ts']){const response=await fetch(base+path);expect(response.status).toBe(404);expect(await response.text()).not.toContain(secret);}
  const post=(body:unknown)=>fetch(base+'/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
  expect((await post({message:'x'.repeat(70000)})).status).toBe(413);
  const response=await post({message:'procesa'}),body=await response.text();expect(body).not.toContain(secret);expect(body).toContain('Herramienta no autorizada');
  expect((await post({message:'hola',directory:'C:/'})).status).toBe(400);
 }finally{await new Promise<void>(r=>server.close(()=>r()));await w.dispose();}
});
