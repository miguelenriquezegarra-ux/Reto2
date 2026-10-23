import { it,expect } from 'vitest';
import { processSequential } from '../../src/application/process-mailbox.js';
it('a bad item does not abort remaining items',async()=>{expect(await processSequential([1,2],async n=>{if(n===1)throw new Error('bad');return n;})).toEqual([{ok:false,error:'Mensaje falló; lote continúa'},2]);});
