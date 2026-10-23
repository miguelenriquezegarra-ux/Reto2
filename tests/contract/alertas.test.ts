import { it,expect } from 'vitest';
import { alertas } from '../../src/tools/contratos.js';
import { workspace } from '../support/workspace.js';
it('returns the baseline alert oracle and rejects invalid date',async()=>{const w=await workspace();try{const a=JSON.parse(await alertas.execute({hoy:'2026-09-03'},w.ctx));expect(a.ok).toBe(true);expect(a.data.vencen.map((r:{id_contrato:string})=>r.id_contrato).sort()).toEqual(['CT-2026-004','CT-2026-009']);expect(a.data.polizas_pendientes).toHaveLength(1);expect(JSON.parse(await alertas.execute({hoy:'2026-02-30'},w.ctx)).ok).toBe(false);}finally{await w.dispose();}});
