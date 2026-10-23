import { expect,it } from 'vitest';
import { dateSchema, rowSchema, extractionSchema } from '../../src/domain/schemas.js';
it('rejects impossible dates and required nulls',()=>{expect(dateSchema.safeParse('2026-02-30').success).toBe(false);expect(dateSchema.safeParse('2026-02-28').success).toBe(true);expect(rowSchema.safeParse({}).success).toBe(false);});
it('requires confidence in range and preserves partial extraction',()=>{expect(extractionSchema.safeParse({confianza:{valor:1.1}}).success).toBe(false);const c=extractionSchema.parse({});expect(c.fecha_inicio).toBeNull();expect(c.confianza).toEqual({});});
