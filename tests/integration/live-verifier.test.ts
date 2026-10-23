import { it,expect,vi } from 'vitest';
import { writeFile } from 'node:fs/promises';
import { workspace } from '../support/workspace.js';
import { fixtureAdapter } from '../support/fixture-adapter.js';
import { Agent } from '../../src/agent/loop.js';
import { loadConfig } from '../../src/config.js';
import { verifyLive } from '../../scripts/verify-live.js';
it('checks HTTP and operator-side final state with an entirely controlled transport',async()=>{
 const w=await workspace();try{
  for(const [key,value]of Object.entries({RUN_LIVE:'1',LIVE_CHECK_MODE:'1',LIVE_TARIFF_REVIEWED:'1',SOURCE_REVISION:'test-only',LIVE_URL:'https://evaluation.invalid',LIVE_STATE_ROOT:w.ctx.directory}))vi.stubEnv(key,value);
  const agent=new Agent(w.ctx.directory,await fixtureAdapter(),loadConfig({}));
  vi.stubGlobal('fetch',async(input:URL,init?:RequestInit)=>{if(input.pathname==='/api/health')return Response.json({ok:true,provider:'controlled-test'});const result=await agent.chat(JSON.parse(String(init?.body)));await writeFile(await w.rt.repo.path('out/usage.json'),JSON.stringify({total:10,input:8,output:2,calls:1,blocked:false}));return Response.json(result);});
  const evidence=await verifyLive();expect(evidence.state.rows).toBe(11);expect(evidence.state.archiveProof.every(p=>p.hashMatches)).toBe(true);expect(evidence.configuration).toEqual({ok:true,provider:'controlled-test'});
 }finally{vi.unstubAllGlobals();vi.unstubAllEnvs();await w.dispose();}
});
