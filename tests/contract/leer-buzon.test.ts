import { it,expect } from 'vitest';
import { leer_buzon } from '../../src/tools/contratos.js';
import { workspace } from '../support/workspace.js';
it('serializes six pending messages and rejects extra arguments',async()=>{const w=await workspace();try{const r=JSON.parse(await leer_buzon.execute({},w.ctx));expect(r.ok).toBe(true);expect(r.data.mensajes).toHaveLength(6);expect(JSON.parse(await leer_buzon.execute({extra:true},w.ctx)).ok).toBe(false);}finally{await w.dispose();}});
