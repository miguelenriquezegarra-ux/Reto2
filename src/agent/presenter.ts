import type { CallView,Pending } from './sessions.js';
import { report, type alerts } from '../domain/alerts.js';
export function present(calls:CallView[],pending:Pending[],reason?:string):string{
 const lines:string[]=[];
 for(const c of calls){
  if(!c.ok){lines.push(`${c.name}: ${c.resultSummary}`);continue;}
  const data=JSON.parse(c.resultSummary) as Record<string,unknown>;
  if(c.name==='contratos_alertas')lines.push(report(data as ReturnType<typeof alerts>,String((c.args as {hoy:string}).hoy)));
  else if(c.name==='contratos_registrar')lines.push(`${String(data.id_contrato)}: ${String(data.accion)} completado.`);
 }
 if(reason)lines.push(reason);
 if(pending.length){for(const p of pending)lines.push(`${p.mensaje_id}: revisión ${p.fields.join(', ')}. ¿Puede precisar los datos pendientes y confirmar el candidato mostrado?`);}
 else lines.push(calls.length?'Turno completado con los resultados de herramientas mostrados.':'No se obtuvieron nuevos datos de herramientas.');
 return lines.join('\n\n');
}
