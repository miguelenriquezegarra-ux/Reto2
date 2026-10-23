import { it,expect } from 'vitest';
import { Agent } from '../../src/agent/loop.js';
import { ScriptedAdapter } from '../support/llm-adapter.js';
import { loadConfig } from '../../src/config.js';
import { workspace } from '../support/workspace.js';
it('stops exactly at the configured iteration limit and preserves calls',async()=>{const w=await workspace();try{const response={texto:'',toolCalls:[{id:'read',nombre:'contratos_leer_buzon',argumentos:{}}],usage:{inputTokens:0,outputTokens:0}};const fake=new ScriptedAdapter([response,response,response]);const agent=new Agent(w.ctx.directory,fake,loadConfig({AGENT_MAX_ITERATIONS:'2'}));const result=await agent.chat({message:'procesa'});expect(fake.index).toBe(2);expect(result.status).toBe('limited');expect(result.toolCalls).toHaveLength(2);expect(agent.sessions.get(result.sessionId)?.messages).toHaveLength(2);}finally{await w.dispose();}});
