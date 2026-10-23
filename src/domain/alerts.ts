import { dateSchema,type Row } from './schemas.js';
export function alerts(rows:Row[],today:string){dateSchema.parse(today);const sort=(a:Row,b:Row)=>a.id_contrato.localeCompare(b.id_contrato);return {
 vencen:rows.filter(r=>{const days=(Date.parse(r.fecha_fin)-Date.parse(today))/86400000;return days>=0&&days<=60;}).sort((a,b)=>a.fecha_fin.localeCompare(b.fecha_fin)||sort(a,b)),
 polizas_pendientes:rows.filter(r=>r.requiere_poliza&&r.estado_poliza!=='vigente').sort(sort),registrados_desde_corte:rows.filter(r=>r.fecha_registro>='2026-05-30').sort(sort)
};}
export function report(data:ReturnType<typeof alerts>,today:string):string{const escape=(s:string)=>s.replace(/[|\r\n]/g,' ');return `# Alertas de contratos — ${today}\n\n`+[['Vencen en ≤ 60 días',data.vencen],['Pólizas pendientes',data.polizas_pendientes],['Registrados desde 2026-05-30',data.registrados_desde_corte]].map(([title,raw])=>`## ${title}\n\n`+(raw as Row[]).map(r=>`- ${escape(r.id_contrato)} | ${escape(r.cliente)} | ${r.fecha_fin} | ${r.estado_poliza}`).join('\n')+'\n').join('\n');}
