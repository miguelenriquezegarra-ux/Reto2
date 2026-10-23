import { it,expect } from 'vitest';
import { readFile } from 'node:fs/promises';
import { decodeRows } from '../../src/infrastructure/contracts-repository.js';
import { extract } from '../../src/domain/extract.js';
import { validate } from '../../src/domain/validate.js';
it('preserves update/duplicate precedence and missing-data review',async()=>{const rows=decodeRows(await readFile('fixtures/reto-02/maestro-contratos.csv','utf8'));const dup=extract(await readFile('fixtures/reto-02/buzon/msg-004/contrato.txt','utf8'));expect(validate(dup,rows).clasificacion).toBe('duplicado');dup.es_otrosi=true;expect(validate(dup,rows).clasificacion).toBe('actualizacion');const partial=extract(await readFile('fixtures/reto-02/buzon/msg-006/contrato.txt','utf8'));expect(validate(partial,rows).requiere_revision).toContain('fecha_inicio');expect(validate(partial,rows).requiere_revision).toContain('valor');expect(validate(partial,rows).requiere_revision).toContain('requiere_poliza');});
