import { expect,it } from 'vitest';
import { loadConfig } from '../../src/config.js';
it('has bounded defaults and runs without a key',()=>{const c=loadConfig({});expect(c.OPENAI_API_KEY).toBe('');expect(c.AGENT_MAX_ITERATIONS).toBe(25);expect(()=>loadConfig({SESSION_TOKEN_BUDGET:'0'})).toThrow();expect(()=>loadConfig({APP_TIMEZONE:'invalid'})).toThrow();});
