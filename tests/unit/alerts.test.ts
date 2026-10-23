import { it,expect } from 'vitest';
import { alerts } from '../../src/domain/alerts.js';
import { workspace } from '../support/workspace.js';
it('includes day0/day60, excludes expired/day61, preserves independent policy alerts',async()=>{const w=await workspace();try{const rows=await w.rt.repo.rows();const base=rows[0]!;const sample=['2026-09-02','2026-09-03','2026-11-02','2026-11-03'].map((fecha_fin,i)=>({...base,id_contrato:String(i),fecha_fin,estado_poliza:'pendiente' as const}));const a=alerts(sample,'2026-09-03');expect(a.vencen.map(r=>r.id_contrato)).toEqual(['1','2']);expect(a.polizas_pendientes).toHaveLength(4);}finally{await w.dispose();}});
