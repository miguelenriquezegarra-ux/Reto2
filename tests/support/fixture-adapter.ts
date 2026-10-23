import { readFile } from 'node:fs/promises';
import { extract } from '../../src/domain/extract.js';
import { ScriptedAdapter } from './llm-adapter.js';
import type { ModelResponse } from '../../src/llm/adapter.js';
export async function fixtureAdapter(){
 const answers:ModelResponse[]=[];const call=(nombre:string,argumentos:unknown)=>answers.push({texto:'',toolCalls:[{id:String(answers.length),nombre,argumentos}],usage:{inputTokens:0,outputTokens:0}});
 call('contratos_leer_buzon',{});
 for(const id of ['msg-001','msg-002','msg-003','msg-004','msg-006']){const contrato=extract(await readFile(`fixtures/reto-02/buzon/${id}/${id==='msg-003'?'otrosi':'contrato'}.txt`,'utf8'));call('contratos_extraer',{mensaje_id:id});call('contratos_validar',{mensaje_id:id,contrato});if(id==='msg-001'||id==='msg-002')call('contratos_registrar',{mensaje_id:id,contrato});}
 call('contratos_alertas',{hoy:'2026-09-03'});return new ScriptedAdapter(answers);
}
