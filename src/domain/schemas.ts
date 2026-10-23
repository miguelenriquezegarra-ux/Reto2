import { z } from 'zod';
export const dateSchema=z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(v=>{const t=Date.parse(`${v}T00:00:00Z`);return Number.isFinite(t)&&new Date(t).toISOString().slice(0,10)===v;},'fecha inválida');
export const rowShape={
  id_contrato:z.string().min(1),cliente:z.string().min(1),nit_cliente:z.string().regex(/^\d+$/),pais:z.enum(['CO','EC','PE','PA','HN']),objeto:z.string().min(1).max(200),valor:z.number().finite().nonnegative(),moneda:z.enum(['COP','USD','PEN','PAB','HNL']),fecha_inicio:dateSchema,fecha_fin:dateSchema,requiere_poliza:z.boolean(),tipo_poliza:z.string(),estado_poliza:z.enum(['vigente','pendiente','vencida','no_aplica']),comercial:z.string(),ruta_sharepoint:z.string(),fecha_registro:dateSchema,fuente:z.enum(['buzon','manual','migracion'])
};
export const columns=Object.keys(rowShape) as (keyof typeof rowShape)[];
export const rowSchema=z.strictObject(rowShape).refine(v=>v.fecha_fin>=v.fecha_inicio,'fecha fin anterior al inicio').refine(v=>v.requiere_poliza ? v.tipo_poliza.length>0&&v.estado_poliza!=='no_aplica' : v.tipo_poliza===''&&v.estado_poliza==='no_aplica','póliza inconsistente');
const partialShape=Object.fromEntries(columns.map(k=>[k,(rowShape[k] as z.ZodType).nullable().default(null)])) as {[K in keyof typeof rowShape]:z.ZodDefault<z.ZodNullable<(typeof rowShape)[K]>>};
export const extractionSchema=z.strictObject({...partialShape,confianza:z.record(z.string(),z.number().min(0).max(1)).default({}),evidencia:z.record(z.string(),z.object({texto:z.string(),origen:z.enum(['documento','derivación','maestro','catálogo','humano','sistema'])})).default({}),valor_indeterminado:z.boolean().default(false),es_otrosi:z.boolean().default(false),condicion_poliza:z.string().nullable().default(null)});
export const messageSchema=z.strictObject({id:z.string().regex(/^[a-zA-Z0-9_-]+$/),de:z.email(),para:z.email(),asunto:z.string(),fecha:z.iso.datetime({offset:true}),cuerpo:z.string(),adjuntos:z.array(z.string())});
export const catalogSchema=z.array(z.strictObject({email:z.email(),nombre:z.string(),region:z.string()}));
export type Row=z.infer<typeof rowSchema>;
export type Extraction=z.infer<typeof extractionSchema>;
export type Message=z.infer<typeof messageSchema>;
export type Field=keyof typeof rowShape;
export const classificationSchema=z.enum(['nuevo','actualizacion','duplicado','rechazado']);
export type Classification=z.infer<typeof classificationSchema>;
