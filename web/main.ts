import './styles.css';
interface Call {id:string;name:string;args:unknown;resultSummary:string;ok:boolean}
interface Pending {id:string;mensaje_id:string;fields:string[];candidate:Record<string,unknown>}
interface ResponseData {sessionId:string;reply?:string;messages?:{role:string;content:string;toolCalls?:Call[]}[];toolCalls?:Call[];pending?:Pending|Pending[];needsConfirmation:boolean;status:string;error?:string}
const el=<T extends HTMLElement>(id:string)=>document.getElementById(id) as T;
const history=el('history'),review=el('review'),chat=el<HTMLFormElement>('chat'),message=el<HTMLTextAreaElement>('message');
let sessionId=localStorage.getItem('contract-session')??undefined;
function add(role:string,text:string,calls:Call[]=[]){const article=document.createElement('article');article.className=role;const label=document.createElement('small');label.textContent=role==='user'?'Tú':'Registro · asistente';const p=document.createElement('pre');p.textContent=text;article.append(label,p);
 for(const call of calls){const details=document.createElement('details'),summary=document.createElement('summary'),body=document.createElement('pre');summary.textContent=call.name;body.textContent=`Argumentos\n${JSON.stringify(call.args,null,2)}\n\nResultado\n${call.resultSummary}`;details.append(summary,body);article.append(details);}
 const rows=new Map<string,string[]>();
 for(const call of calls){if(!call.ok)continue;const args=call.args as {mensaje_id?:string};const data=JSON.parse(call.resultSummary) as Record<string,unknown>;
  if(call.name==='contratos_leer_buzon')for(const m of (data.mensajes??[]) as {id:string;clasificacion?:string}[])rows.set(m.id,[m.id,m.clasificacion??'pendiente','']);
  if(call.name==='contratos_validar'&&args.mensaje_id)rows.set(args.mensaje_id,[args.mensaje_id,String(data.clasificacion),(data.requiere_revision as string[]).join(', ')]);
  if(call.name==='contratos_registrar'&&args.mensaje_id)rows.set(args.mensaje_id,[args.mensaje_id,String(data.accion),'Registrado']);
 }
 if(rows.size){const table=document.createElement('table');const head=table.createTHead().insertRow();for(const label of ['Mensaje','Resultado','Revisión / acción']){const th=document.createElement('th');th.textContent=label;head.append(th);}const body=table.createTBody();for(const row of rows.values()){const tr=body.insertRow();for(const value of row)tr.insertCell().textContent=value;}article.append(table);}
 history.append(article);history.scrollTop=history.scrollHeight;
}
async function send(text:string,humanAction?:{pendingId:string;kind:'confirm';fields:Record<string,unknown>}){
 add('user',text);el('thinking').hidden=false;chat.querySelector('button')!.disabled=true;
 try{const response=await fetch('/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId,message:text,humanAction})});const data=await response.json() as ResponseData;if(!response.ok)throw new Error(data.error??'No se completó el turno');sessionId=data.sessionId;localStorage.setItem('contract-session',sessionId);add('assistant',data.reply??'',data.toolCalls);renderPending(data);}
 catch(error){add('assistant',error instanceof Error?error.message:'No se completó el turno');}
 finally{el('thinking').hidden=true;chat.querySelector('button')!.disabled=false;}
}
function renderPending(data:ResponseData){review.replaceChildren();const p=Array.isArray(data.pending)?data.pending[0]:data.pending;if(!data.needsConfirmation||!p){review.hidden=true;return;}review.hidden=false;const title=document.createElement('h2');title.textContent='Revisión humana';const info=document.createElement('p');info.textContent=`${p.mensaje_id}: precisa los campos pendientes y confirma el candidato. Ninguna fecha se completará automáticamente.`;const values=document.createElement('pre');values.textContent=JSON.stringify(p.candidate,null,2);const detail=document.createElement('details'),summary=document.createElement('summary');summary.textContent='Ver candidato y evidencia';detail.append(summary,values);review.append(title,info,detail);
 const form=document.createElement('form');
 for(const field of p.fields){const wrap=document.createElement('div'),label=document.createElement('label');label.htmlFor=`review-${field}`;label.textContent=field;let input:HTMLInputElement|HTMLSelectElement;
  if(field==='requiere_poliza'){const select=document.createElement('select');for(const [value,text]of [['','Seleccionar'],['true','Sí'],['false','No']]){const option=document.createElement('option');option.value=value!;option.textContent=text!;select.append(option);}input=select;}
  else{input=document.createElement('input');if(field==='valor'){input.type='number';input.step='any';}}
  input.id=label.htmlFor;input.name=field;input.value=p.candidate[field]===null?'':String(p.candidate[field]??'');if(field!=='tipo_poliza')input.required=true;wrap.append(label,input);form.append(wrap);
 }
 const confirm=document.createElement('button');confirm.textContent='Confirmar datos revisados';form.append(confirm);form.addEventListener('submit',event=>{event.preventDefault();const fields:Record<string,unknown>={};for(const field of p.fields){const value=new FormData(form).get(field)?.toString()??'';fields[field]=field==='valor'?Number(value):field==='requiere_poliza'?value==='true':value;}confirm.disabled=true;void send('Confirmo los datos precisados en el formulario',{pendingId:p.id,kind:'confirm',fields});});review.append(form);
}
chat.addEventListener('submit',event=>{event.preventDefault();const text=message.value.trim();if(text){message.value='';void send(text);}});
el('example').addEventListener('click',()=>{message.value='Procesa el buzón de contratos con fecha de hoy 2026-09-03. Registra lo limpio, muestra lo que requiere revisión y termina con el reporte de alertas. No registres nada dudoso sin preguntarme.';message.focus();});
try{const response=await fetch('/api/health');el('connection').textContent=response.ok?'Servicio configurado':'Configurar OpenAI en backend';}catch{el('connection').textContent='Sin conexión al servicio';}
if(sessionId){try{const response=await fetch(`/api/sessions/${sessionId}`);if(response.ok){const data=await response.json() as ResponseData;for(const m of data.messages??[])add(m.role,m.content,m.toolCalls);renderPending(data);}else{localStorage.removeItem('contract-session');sessionId=undefined;add('assistant','Sesión anterior no disponible. El maestro se conserva; puedes iniciar otra conversación.');}}catch{add('assistant','No se pudo recuperar el historial.');}}
