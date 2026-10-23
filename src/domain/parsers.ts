import { dateSchema } from './schemas.js';
const months=['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
export function dates(text:string):string[]{
 const result:string[]=[];
 for(const match of text.matchAll(/(?:\((\d{1,2})\)|\b(\d{1,2}))\s+de\s+([a-záéíóú]+)\s+de\s+(\d{4})/gi)){
  const month=months.indexOf((match[3]??'').toLowerCase())+1;if(!month)throw new Error('fecha inválida');
  result.push(dateSchema.parse(`${match[4]}-${String(month).padStart(2,'0')}-${String(match[1]??match[2]).padStart(2,'0')}`));
 }
 return result;
}
export function amount(raw:string):number {const clean=raw.replace(/[.,]$/,'');let value:string;if(/,\d{2}$/.test(clean))value=clean.replace(/\./g,'').replace(',','.');else if(/\.\d{2}$/.test(clean))value=clean.replace(/,/g,'');else value=clean.replace(/[.,]/g,'');const n=Number(value);if(!Number.isFinite(n)||n<0)throw new Error('valor inválido');return n;}
export function addMonthsInclusive(start:string,months:number):string{const date=new Date(`${dateSchema.parse(start)}T00:00:00Z`);const day=date.getUTCDate();date.setUTCDate(1);date.setUTCMonth(date.getUTCMonth()+months);const last=new Date(Date.UTC(date.getUTCFullYear(),date.getUTCMonth()+1,0)).getUTCDate();date.setUTCDate(Math.min(day,last));date.setUTCDate(date.getUTCDate()-1);return date.toISOString().slice(0,10);}
export const normalize=(text:string)=>text.normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim().replace(/\s+/g,' ');
