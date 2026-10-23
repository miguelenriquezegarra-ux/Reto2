import { it,expect } from 'vitest';
import { extraer,validar } from '../../src/tools/contratos.js';
import { workspace } from '../support/workspace.js';
it('classifies fixture contracts and unknown sender does not itself block',async()=>{const w=await workspace();try{for(const [id,kind] of [['msg-001','nuevo'],['msg-002','nuevo'],['msg-003','actualizacion'],['msg-004','duplicado'],['msg-006','nuevo']]){const c=JSON.parse(await extraer.execute({mensaje_id:id},w.ctx)).data;const v=JSON.parse(await validar.execute({mensaje_id:id,contrato:c},w.ctx));expect(v).toMatchObject({ok:true,data:{clasificacion:kind}});expect(v.data.requiere_revision).not.toContain('comercial');}}finally{await w.dispose();}});
