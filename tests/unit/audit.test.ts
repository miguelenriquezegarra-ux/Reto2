import { it,expect } from 'vitest';
import { readFile } from 'node:fs/promises';
import { workspace } from '../support/workspace.js';
it('redacts secrets and correlates events',async()=>{const w=await workspace();try{await w.rt.audit.event('test',null,false,'Bearer secret sk-fakekey');const text=await readFile(await w.rt.repo.path('out/log.jsonl'),'utf8');expect(text).not.toContain('secret');expect(text).not.toContain('sk-fakekey');expect(JSON.parse(text).correlationId).toBeTruthy();}finally{await w.dispose();}});
