import { expect,it } from 'vitest';
import { confined,safePath } from '../../src/infrastructure/paths.js';
it('rejects escape and permits fixture relative paths',async()=>{expect(()=>confined(process.cwd(),'../outside')).toThrow();expect(()=>confined(process.cwd(),'C:/outside')).toThrow();expect(await safePath(process.cwd(),'fixtures/reto-02/comerciales.json')).toContain('comerciales.json');});
