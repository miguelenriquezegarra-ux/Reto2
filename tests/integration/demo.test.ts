import { it,expect } from 'vitest';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { readFile } from 'node:fs/promises';
import { decodeRows } from '../../src/infrastructure/contracts-repository.js';
const exec=promisify(execFile);
it('runs twice with no key and identical business results',async()=>{const env={...process.env};delete env.OPENAI_API_KEY;const a=await exec(process.execPath,['--import','tsx','demo.ts'],{env});const b=await exec(process.execPath,['--import','tsx','demo.ts'],{env});expect(a.stdout).toContain('11 contratos');expect(a.stdout).toBe(b.stdout);expect(decodeRows(await readFile('out/sharepoint/maestro-contratos.csv','utf8'))).toHaveLength(11);expect((await readFile('out/sharepoint/historial.jsonl','utf8')).trim().split('\n')).toHaveLength(4);},20000);
