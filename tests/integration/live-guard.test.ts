import { it,expect } from 'vitest';
import { verifyLive } from '../../scripts/verify-live.js';
it('refuses live execution before any network or writes without opt-in',async()=>{const old=process.env.RUN_LIVE;delete process.env.RUN_LIVE;try{await expect(verifyLive()).rejects.toThrow('Live deshabilitado');}finally{if(old===undefined)delete process.env.RUN_LIVE;else process.env.RUN_LIVE=old;}});
