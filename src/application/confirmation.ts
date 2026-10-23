import type { Extraction } from '../domain/schemas.js';
import { columns,extractionSchema } from '../domain/schemas.js';
import { hash } from '../infrastructure/contracts-repository.js';
import type { Runtime } from './runtime.js';
export const candidateHash=(c:Extraction)=>hash(columns.map(k=>c[k]));
export function grant(rt:Runtime,id:string,candidate:Extraction,revision:string):void{rt.policy.grants.set(id,{candidate:structuredClone(candidate),revision});}
export function correction(candidate:Extraction,fields:Record<string,unknown>):Extraction{
 for(const key of Object.keys(fields)){if(!columns.includes(key as typeof columns[number])||['id_contrato','fuente','fecha_registro','ruta_sharepoint','comercial'].includes(key))throw new Error('Campo no revisable');}
 const result=extractionSchema.parse({...candidate,...fields});for(const key of Object.keys(fields))result.evidencia[key]={texto:'Dato explícito del usuario; pendiente de validar',origen:'humano'};return result;
}
