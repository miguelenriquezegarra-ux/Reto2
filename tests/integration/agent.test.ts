import { it,expect,vi } from 'vitest';
import { Agent } from '../../src/agent/loop.js';
import { ScriptedAdapter } from '../support/llm-adapter.js';
import { loadConfig } from '../../src/config.js';
import { workspace } from '../support/workspace.js';
import { readFile } from 'node:fs/promises';
import { extract } from '../../src/domain/extract.js';
import { humanExample } from '../support/human-inputs.js';
import { fixtureAdapter } from '../support/fixture-adapter.js';
import { encodeRows } from '../../src/infrastructure/contracts-repository.js';
import { runtime } from '../../src/application/runtime.js';
it('uses the configured timezone for the conversational execution date',async()=>{const w=await workspace();vi.useFakeTimers({toFake:['Date']});vi.setSystemTime(new Date('2026-09-03T01:00:00Z'));try{const agent=new Agent(w.ctx.directory,new ScriptedAdapter([]),loadConfig({APP_TIMEZONE:'Pacific/Auckland'}));const result=await agent.chat({message:'hola'});expect((await runtime({directory:w.ctx.directory,sessionId:result.sessionId})).clock.today()).toBe('2026-09-03');}finally{vi.useRealTimers();await w.dispose();}});
it('runs the whole mailbox, rejects foreign/stale confirmation and keeps pending work',async()=>{
 const w=await workspace();try{const agent=new Agent(w.ctx.directory,await fixtureAdapter(),loadConfig({}));const first=await agent.chat({message:'procesa todo'});expect(await w.rt.repo.rows()).toHaveLength(10);expect(first.pending?.mensaje_id).toBe('msg-003');expect(first.toolCalls.some(c=>c.name==='contratos_alertas')).toBe(true);
 const other=agent.sessions.create();await expect(agent.chat({sessionId:other.id,message:'confirmo',humanAction:{pendingId:first.pending!.id,kind:'confirm'}})).rejects.toThrow('Confirmación');
 await w.rt.repo.exclusive(async()=>{const rows=await w.rt.repo.rows();rows[0]!.comercial='Cambio concurrente';await w.rt.repo.atomic('out/sharepoint/maestro-contratos.csv',encodeRows(rows));});
 const changed=await agent.chat({sessionId:first.sessionId,message:'confirmo',humanAction:{pendingId:first.pending!.id,kind:'confirm'}});expect(changed.toolCalls).toHaveLength(0);expect(changed.needsConfirmation).toBe(true);expect(changed.reply).toContain('Candidato actualizado');
 }finally{await w.dispose();}
});
it('rejects simultaneous turns without dropping the first session',async()=>{
 const w=await workspace();try{let finish:((value:{texto:string;toolCalls:[];usage:{inputTokens:number;outputTokens:number}})=>void)|undefined;const agent=new Agent(w.ctx.directory,{enviar:()=>new Promise(resolve=>{finish=resolve;})},loadConfig({}));const session=agent.sessions.create();const running=agent.chat({sessionId:session.id,message:'hola'});while(!finish)await new Promise(resolve=>setTimeout(resolve,1));await expect(agent.chat({sessionId:session.id,message:'segundo'})).rejects.toThrow('Turno en curso');finish({texto:'',toolCalls:[],usage:{inputTokens:0,outputTokens:0}});expect((await running).sessionId).toBe(session.id);
 }finally{await w.dispose();}
});
it('preserves session after provider failure and hides unsupported model facts',async()=>{const w=await workspace();try{const agent=new Agent(w.ctx.directory,new ScriptedAdapter([new Error('Proveedor no disponible'),{texto:'Contrato inexistente por 999999',toolCalls:[],usage:{inputTokens:0,outputTokens:0}}]),loadConfig({}));const a=await agent.chat({message:'hola'}) as {sessionId:string;status:string};expect(a.status).toBe('provider_error');const b=await agent.chat({sessionId:a.sessionId,message:'continúa'}) as {reply:string};expect(b.reply).not.toContain('999999');}finally{await w.dispose();}});
it('rejects model-only confirmation, preserves partial human confirmation, accepts completed human candidate',async()=>{const w=await workspace();try{
 const candidate=extract(await readFile('fixtures/reto-02/buzon/msg-006/contrato.txt','utf8'));
 const call=(name:string,args:unknown)=>({texto:'',toolCalls:[{id:name,nombre:name,argumentos:args}],usage:{inputTokens:0,outputTokens:0}});
 const agent=new Agent(w.ctx.directory,new ScriptedAdapter([call('contratos_validar',{mensaje_id:'msg-006',contrato:candidate}),call('contratos_registrar',{mensaje_id:'msg-006',contrato:candidate,confirmado:true})]),loadConfig({}));
 const first=await agent.chat({message:'procesa'});expect(first.needsConfirmation).toBe(true);expect(await w.rt.repo.rows()).toHaveLength(8);
 const partial=await agent.chat({sessionId:first.sessionId,message:'confirmo el valor 0 y la fecha fin 2027-08-31'});expect(partial.needsConfirmation).toBe(true);expect(await w.rt.repo.rows()).toHaveLength(8);
 const final=await agent.chat({sessionId:first.sessionId,message:'Confirmo los campos precisos',humanAction:{pendingId:partial.pending!.id,kind:'confirm',fields:humanExample}});expect(final.toolCalls.some(c=>c.name==='contratos_registrar'&&c.ok)).toBe(true);expect(await w.rt.repo.rows()).toHaveLength(9);
}finally{await w.dispose();}});
