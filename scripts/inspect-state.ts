import { readFile,readdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { decodeRows } from '../src/infrastructure/contracts-repository.js';
import { safePath } from '../src/infrastructure/paths.js';
export async function inspectState(root:string){
 const read=(p:string)=>readFile(resolve(root,'out',p),'utf8');const csv=await read('sharepoint/maestro-contratos.csv');const rows=decodeRows(csv);
 const history=(await read('sharepoint/historial.jsonl')).trim().split('\n').filter(Boolean).map(line=>JSON.parse(line) as unknown);
 const processed=JSON.parse(await read('procesados.json')) as Record<string,{sourceHash?:string;receipt?:{id_contrato:string;ruta_archivo:string}}>;
 const archiveProof=await Promise.all(Object.entries(processed).filter(([,entry])=>entry.receipt).map(async([id,entry])=>{const text=await readFile(await safePath(root,`out/sharepoint/${entry.receipt!.ruta_archivo}`),'utf8');return {message:id,id:entry.receipt!.id_contrato,hashMatches:createHash('sha256').update(text).digest('hex')===entry.sourceHash};}));
 const logs=(await read('log.jsonl')).trim().split('\n').filter(Boolean).map(line=>JSON.parse(line) as unknown);
 const usage=JSON.parse(await read('usage.json').catch(e=>{if((e as NodeJS.ErrnoException).code==='ENOENT')return 'null';throw e;})) as {total:number;input:number;output:number;calls:number;blocked:boolean}|null;
 const journals=await readdir(resolve(root,'out/.transactions')).catch(e=>{if((e as NodeJS.ErrnoException).code==='ENOENT')return [];throw e;});
 return {rows:rows.length,uniqueIds:new Set(rows.map(r=>r.id_contrato)).size,masterSha256:createHash('sha256').update(csv).digest('hex'),historyEntries:history.length,processed,archiveProof,logEntries:logs.length,usage,journals:journals.length,contracts:rows.map(r=>({id:r.id_contrato,valor:r.valor,fin:r.fecha_fin,registro:r.fecha_registro})),alerts:await read('alertas.md')};
}
if(process.argv[1]?.endsWith('inspect-state.ts'))console.log(JSON.stringify(await inspectState(process.argv[2]??process.cwd()),null,2));
