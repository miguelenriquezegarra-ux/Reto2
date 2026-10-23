import { columns,type Extraction,type Row,type Classification } from './schemas.js';
import { similarity } from './similarity.js';
export interface Validation {clasificacion:Classification;id_contrato_existente?:string;requiere_revision:string[];diferencias:Record<string,{antes:unknown;despues:unknown}>;candidato:Extraction}
export function validate(input:Extraction,rows:Row[]):Validation{
 const c=structuredClone(input),revision=new Set<string>();
 const exact=rows.find(r=>r.id_contrato===c.id_contrato);
 const matches=exact?[exact]:rows.filter(r=>r.nit_cliente===c.nit_cliente&&c.objeto&&similarity(r.objeto,c.objeto)>=0.9);
 const existing=matches.length===1?matches[0]:undefined;
 if(matches.length>1)revision.add('conflicto_identidad');
 let clasificacion:Classification='nuevo';
 if(c.es_otrosi){clasificacion='actualizacion';if(!existing)revision.add('contrato_existente');}
 else if(existing){clasificacion=['id_contrato','valor','fecha_inicio','fecha_fin'].every(k=>c[k as keyof Extraction]===existing[k as keyof Row])?'duplicado':'actualizacion';}
 if(existing&&c.es_otrosi){for(const field of columns){if(c[field]===null){Object.assign(c,{[field]:existing[field]});c.confianza[field]=0.95;c.evidencia[field]={texto:`Campo no modificado en otrosí: ${existing.id_contrato}`,origen:'maestro'};}}}
 if(existing)c.id_contrato=existing.id_contrato;
 const diferencias:Validation['diferencias']={};
 const systemFields=new Set(['id_contrato','ruta_sharepoint','fecha_registro','fuente','comercial']);
 if(clasificacion!=='duplicado')for(const field of columns){
  if(systemFields.has(field))continue;
  if(c[field]===null||(c.confianza[field]??0)<0.8)revision.add(field);
  if(existing&&c[field]!==null&&c[field]!==existing[field]){diferencias[field]={antes:existing[field],despues:c[field]};revision.add(field);}
 }
 if(c.fecha_inicio&&c.fecha_fin&&c.fecha_fin<c.fecha_inicio)throw new Error('fecha fin anterior al inicio');
 return {clasificacion,id_contrato_existente:existing?.id_contrato,requiere_revision:[...revision],diferencias,candidato:c};
}
