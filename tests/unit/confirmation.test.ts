import { it,expect } from 'vitest';
import { workspace } from '../support/workspace.js';
import { extraer,registrar } from '../../src/tools/contratos.js';
it('rejects conversational model boolean without human grant',async()=>{const w=await workspace();try{w.rt.policy.mode='conversation';const c=JSON.parse(await extraer.execute({mensaje_id:'msg-006'},w.ctx)).data;Object.assign(c,{fecha_inicio:'2026-08-01',fecha_fin:'2027-08-31',moneda:'COP',requiere_poliza:false,tipo_poliza:'',estado_poliza:'no_aplica'});const result=JSON.parse(await registrar.execute({mensaje_id:'msg-006',contrato:c,confirmado:true},w.ctx));expect(result.ok).toBe(false);expect(await w.rt.repo.rows()).toHaveLength(8);}finally{await w.dispose();}});
