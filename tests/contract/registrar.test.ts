import { it,expect } from 'vitest';
import { extraer,registrar } from '../../src/tools/contratos.js';
import { workspace } from '../support/workspace.js';
it('writes a clean new contract and blocks incomplete ones even with a boolean',async()=>{const w=await workspace();try{const a=JSON.parse(await extraer.execute({mensaje_id:'msg-001'},w.ctx)).data;expect(JSON.parse(await registrar.execute({mensaje_id:'msg-001',contrato:a},w.ctx))).toMatchObject({ok:true,data:{id_contrato:'CT-2026-015',accion:'nuevo'}});const b=JSON.parse(await extraer.execute({mensaje_id:'msg-006'},w.ctx)).data;expect(JSON.parse(await registrar.execute({mensaje_id:'msg-006',contrato:b,confirmado:true},w.ctx)).ok).toBe(false);expect(await w.rt.repo.rows()).toHaveLength(9);}finally{await w.dispose();}});
