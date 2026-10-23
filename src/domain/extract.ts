import { extractionSchema,columns,type Extraction,type Field } from './schemas.js';
import { amount,dates,addMonthsInclusive } from './parsers.js';
import { documentKind } from './document-kind.js';
export function extract(text:string):Extraction {
 if(!text.trim())throw new Error('Texto vacío');
 if(documentKind(text)==='rechazado')throw new Error('rechazado: no es un contrato identificable');
 const c=extractionSchema.parse({});c.es_otrosi=documentKind(text)==='otrosi';
 const put=<K extends Field>(key:K,value:Extraction[K],evidence:string,confidence=0.95):void=>{c[key]=value;c.confianza[key]=confidence;c.evidencia[key]={texto:evidence.slice(0,300),origen:'documento'};};
 for(const key of columns){c.confianza[key]=0;c.evidencia[key]={texto:'Ausente en documento',origen:'documento'};}
 const id=text.match(/(?:CONTRATO[^\n]*?No\.\s*)([A-Z]{2}-\d{4}-\d+)/i)?.[1];if(id)put('id_contrato',id,id);
 const party=text.match(/Entre\s+(?:los suscritos,\s*)?(.+?),\s*(?:identificada|NIT)/i)?.[1]?.trim();if(party)put('cliente',party,party);
 const fiscal=text.match(/(?:NIT|RUC|RTN)\s+([\d.]+)(?:-\d)?/i)?.[1];if(fiscal)put('nit_cliente',fiscal.replace(/\./g,''),fiscal,0.9);
 const opening=text.split(/y\s+PERIFERIA/i)[0]??text;
 const country=/Perú|Lima|S\.A\.C\./i.test(opening)?'PE':/Ecuador|Quito/i.test(opening)?'EC':/Panamá|Istmo/i.test(opening)?'PA':/Honduras|Sula/i.test(opening)?'HN':/NIT|Colombia|Bogotá|Barranquilla|Medellín/i.test(opening)?'CO':null;
 if(country)put('pais',country,opening,0.9);
 const object=text.match(/PRIMERA\.\s*OBJETO\.\s*([\s\S]*?)(?=\n\s*SEGUNDA)/i)?.[1]?.trim().replace(/\s+/g,' ');if(object)put('objeto',object.slice(0,200),object);
 const valueClause=text.match(/SEGUNDA\.[\s\S]*?(?=\n\s*TERCERA|$)/i)?.[0]??'';
 if(/no tiene un valor determinado|por demanda/i.test(valueClause)){put('valor',0,valueClause,0.75);c.valor_indeterminado=true;}
 else {const money=valueClause.match(/\b([A-Z]{3})\s*\$?\s*([\d][\d.,]*)/);if(money){put('moneda',money[1] as Extraction['moneda'],money[0]);put('valor',amount(money[2]??''),money[0],0.9);}}
 const plazo=text.match(/(?:TERCERA\.\s*PLAZO\.|PRIMERA\.\s*Modificar)[\s\S]*?(?=\n\s*(?:CUARTA|SEGUNDA)\.|$)/i)?.[0]??'';
 const found=dates(plazo);
 if(c.es_otrosi){if(found[0])put('fecha_fin',found[0],plazo);}
 else {if(found[0])put('fecha_inicio',found[0],plazo);if(found[1])put('fecha_fin',found[1],plazo);else if(found[0]){const m=plazo.match(/\((\d+)\)\s*meses/i)?.[1];if(m)put('fecha_fin',addMonthsInclusive(found[0],Number(m)),plazo,0.75);}}
 if(!c.fecha_inicio&&!c.es_otrosi)c.evidencia.fecha_inicio={texto:text.match(/Se firma[^\n]*/i)?.[0]??'Fecha de inicio ausente',origen:'documento'};
 const guarantee=text.match(/(?:SEXTA|CUARTA)\.\s*GARANT[IÍ]AS\.[\s\S]*?(?=\n\s*[A-ZÁÉÍÓÚ]+\.|\n\s*Se firma|$)/i)?.[0]??'';
 if(/Para cada orden/i.test(guarantee)){c.condicion_poliza=guarantee;c.evidencia.requiere_poliza={texto:guarantee,origen:'documento'};}
 else if(!c.es_otrosi){const required=/póliza/i.test(guarantee);put('requiere_poliza',required,guarantee||'No existe cláusula de garantías',0.9);const types=['cumplimiento','calidad','salarios_prestaciones','responsabilidad_civil'].filter(t=>guarantee.toLowerCase().includes(t.replaceAll('_',' ')));put('tipo_poliza',types.join(';'),guarantee,0.9);put('estado_poliza',required?'pendiente':'no_aplica','Estado de alta según requerimiento',0.9);}
 return extractionSchema.parse(c);
}
