import { alerts,report } from '../domain/alerts.js';
import { runtime } from './runtime.js';
import type { Context } from './ports.js';
export async function generateAlerts(today:string,ctx:Context){const rt=await runtime(ctx);return rt.repo.exclusive(async()=>{const data=alerts(await rt.repo.rows(),today);await rt.repo.transactions.commit({'out/alertas.md':report(data,today)});return {ruta:'out/alertas.md',...data};});}
