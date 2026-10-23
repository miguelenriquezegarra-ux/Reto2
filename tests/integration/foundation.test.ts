import { it,expect } from 'vitest';
import { readFile } from 'node:fs/promises';
import { workspace } from '../support/workspace.js';
it('initializes only isolated out and preserves a valid existing master',async()=>{const w=await workspace();try{expect(await w.rt.repo.rows()).toHaveLength(8);const before=await readFile(await w.rt.repo.path('out/sharepoint/maestro-contratos.csv'),'utf8');await w.rt.repo.initialize();expect(await readFile(await w.rt.repo.path('out/sharepoint/maestro-contratos.csv'),'utf8')).toBe(before);}finally{await w.dispose();}});
