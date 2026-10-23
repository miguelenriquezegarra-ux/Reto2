import { it,expect } from 'vitest';
import { leer_buzon } from '../../src/tools/contratos.js';
import { workspace } from '../support/workspace.js';
it('reports quotation then closes it operationally only',async()=>{const w=await workspace();try{const r=JSON.parse(await leer_buzon.execute({},w.ctx));expect(r.data.mensajes.find((m:{id:string})=>m.id==='msg-005')).toMatchObject({tiene_contrato:false,clasificacion:'rechazado'});expect(JSON.parse(await leer_buzon.execute({},w.ctx)).data.mensajes).toHaveLength(5);expect(await w.rt.repo.rows()).toHaveLength(8);}finally{await w.dispose();}});
