import { it,expect } from 'vitest';
import { extraer } from '../../src/tools/contratos.js';
import { workspace } from '../support/workspace.js';
it('executes extraction without model and returns safe errors',async()=>{const w=await workspace();try{expect(JSON.parse(await extraer.execute({mensaje_id:'msg-001'},w.ctx))).toMatchObject({ok:true,data:{valor:265000000}});expect(JSON.parse(await extraer.execute({mensaje_id:'../'},w.ctx)).ok).toBe(false);}finally{await w.dispose();}});
