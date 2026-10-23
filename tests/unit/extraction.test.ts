import { it,expect } from 'vitest';
import { readFile } from 'node:fs/promises';
import { extract } from '../../src/domain/extract.js';
it('extracts documented values and never guesses partial signing day or conditional policy',async()=>{
 const a=extract(await readFile('fixtures/reto-02/buzon/msg-001/contrato.txt','utf8'));expect(a.valor).toBe(265000000);expect(a.fecha_inicio).toBe('2026-08-01');expect(a.fecha_fin).toBe('2027-07-31');expect(a.nit_cliente).toBe('890900111');
 const b=extract(await readFile('fixtures/reto-02/buzon/msg-002/contrato.txt','utf8'));expect(b.valor).toBe(120000);expect(b.moneda).toBe('USD');expect(b.requiere_poliza).toBe(false);
 const c=extract(await readFile('fixtures/reto-02/buzon/msg-003/otrosi.txt','utf8'));expect(c.valor).toBe(520000);expect(c.fecha_fin).toBe('2027-11-01');expect(c.es_otrosi).toBe(true);
 const d=extract(await readFile('fixtures/reto-02/buzon/msg-006/contrato.txt','utf8'));expect(d.id_contrato).toBe('CM-2026-03');expect(d.valor).toBe(0);expect(d.confianza.valor).toBeLessThan(0.8);expect(d.fecha_inicio).toBeNull();expect(d.confianza.fecha_inicio).toBe(0);expect(d.fecha_fin).toBeNull();expect(d.requiere_poliza).toBeNull();expect(d.condicion_poliza).toContain('orden');
});
