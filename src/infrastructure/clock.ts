import type { Clock } from '../application/ports.js';
export const systemClock=(zone='America/Bogota'):Clock=>({now:()=>new Date(),today:()=>new Intl.DateTimeFormat('en-CA',{timeZone:zone,year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date())});
export const fixedClock=(date='2026-09-03'):Clock=>({now:()=>new Date(`${date}T12:00:00Z`),today:()=>date});
