import { it,expect } from 'vitest';
import { writeFile } from 'node:fs/promises';
import { workspace } from '../support/workspace.js';
import { extraer,alertas,registrar } from '../../src/tools/contratos.js';
it('keeps malformed message open and continues with a clean one',async()=>{const w=await workspace();try{await writeFile(`${w.ctx.directory}/fixtures/reto-02/buzon/msg-001/contrato.txt`,'');expect(JSON.parse(await extraer.execute({mensaje_id:'msg-001'},w.ctx)).ok).toBe(false);expect((await w.rt.repo.processed())['msg-001']).toBeUndefined();const c=JSON.parse(await extraer.execute({mensaje_id:'msg-002'},w.ctx)).data;expect(JSON.parse(await registrar.execute({mensaje_id:'msg-002',contrato:c},w.ctx)).ok).toBe(true);expect(JSON.parse(await alertas.execute({hoy:'bad'},w.ctx)).ok).toBe(false);}finally{await w.dispose();}});
