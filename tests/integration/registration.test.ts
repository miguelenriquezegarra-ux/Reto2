import { it,expect } from 'vitest';
import { readFile } from 'node:fs/promises';
import { workspace } from '../support/workspace.js';
import { extraer,registrar,validar } from '../../src/tools/contratos.js';
import { humanExample } from '../support/human-inputs.js';
it('confirms explicit human input, updates existing row, and keeps unique history',async()=>{const w=await workspace();try{
 const update=JSON.parse(await extraer.execute({mensaje_id:'msg-003'},w.ctx)).data;expect(JSON.parse(await registrar.execute({mensaje_id:'msg-003',contrato:update},w.ctx)).ok).toBe(false);expect(JSON.parse(await registrar.execute({mensaje_id:'msg-003',contrato:update,confirmado:true},w.ctx)).ok).toBe(true);
 const row=(await w.rt.repo.rows()).find(r=>r.id_contrato==='CT-2026-011');expect(row).toMatchObject({valor:520000,fecha_fin:'2027-11-01',fecha_registro:'2026-05-05',objeto:'Célula ágil de desarrollo para sistema de operaciones'});
 const partial=JSON.parse(await extraer.execute({mensaje_id:'msg-006'},w.ctx)).data;Object.assign(partial,humanExample);expect(JSON.parse(await registrar.execute({mensaje_id:'msg-006',contrato:partial,confirmado:true},w.ctx)).ok).toBe(true);
 expect((await w.rt.repo.rows()).find(r=>r.id_contrato==='CM-2026-03')?.comercial).toBe('');
 expect(JSON.parse(await registrar.execute({mensaje_id:'msg-006',contrato:partial,confirmado:true},w.ctx)).ok).toBe(true);
 expect((await readFile(await w.rt.repo.path('out/sharepoint/historial.jsonl'),'utf8')).trim().split('\n')).toHaveLength(2);
}finally{await w.dispose();}});
