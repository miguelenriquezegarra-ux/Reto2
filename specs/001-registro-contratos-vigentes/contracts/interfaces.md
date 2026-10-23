# Contratos de herramientas, agente, API y UI

Diseño derivado de PRD §6 y spec FR-001–022. Formatos descriptivos, no implementaciones. Todos los objetos externos pasan Zod y valores de dominio antes de uso. Datos desconocidos se reciben como unknown, nunca any.

## Herramientas P0

`src/tools/contratos.ts` exporta exclusivamente `leer_buzon`, `extraer`, `validar`, `registrar`, `alertas`. Los nombres del modelo son `contratos_<export>`. Cada objeto tiene description de una frase, args como objeto de esquemas Zod con describe por campo, y execute asíncrono con ctx `{directory:string,sessionId:string}`; devuelve string JSON `{ok:true,data}` o `{ok:false,error:string}` y nunca propaga excepción. `error` es legible; códigos internos no reemplazan el string exigido. Backend valida antes y herramienta vuelve a validar para ejecución directa. Implementaciones delegan a módulos de aplicación/dominio; servidor no contiene RN.

| Herramienta | Args exactos | Data éxito | Efectos |
| --- | --- | --- | --- |
| contratos_leer_buzon | `{}` | `{mensajes:[{id,de,asunto,fecha,adjuntos:string[],tiene_contrato:boolean}]}` | Inicializa copia RN6 si falta; clasifica/reporta y cierra rechazos definitivos reconocidos al inspeccionar, conforme Q4; lista se construye con pendientes al inicio de la consulta para no ocultar msg-005 antes de informar su rechazo. Clasificación/motivo se añade como metadato del resultado cuando rechazado. |
| contratos_extraer | `{mensaje_id:string}` | Contrato extraído con campos/ confianza/evidencia de data-model.md | Lee adjunto enumerado; error si texto vacío; log. No registra contrato. |
| contratos_validar | `{mensaje_id:string,contrato:ContratoExtraido}` | `{clasificacion,id_contrato_existente?:string,requiere_revision:string[],diferencias?:objeto}` | Calcula candidato y diferencias; guarda snapshot pendiente en runtime; duplicado/rechazado definitivo se cierra Q4. No modifica datos contractuales. |
| contratos_registrar | `{mensaje_id:string,contrato:ContratoExtraido,confirmado?:boolean}` | `{id_contrato:string,accion:"nuevo"|"actualizacion",ruta_archivo:string}` | Revalida siempre. Escribe solo con candidato completo/validado y revisión resuelta o confirmada por canal autorizado. Sin revisión o confirmado según HU-4, sin usar boolean para eludir invariantes/autorización. Receipt en reintento devuelve resultado anterior. |
| contratos_alertas | `{hoy:string YYYY-MM-DD}` | `{ruta:string,vencen:ContratoMaestro[],polizas_pendientes:ContratoMaestro[],registrados_desde_corte:ContratoMaestro[]}` | Publica out/alertas.md a partir de lectura coherente. No cambia maestro/procesados/historial. |

`contrato` extraído conserva metadatos y evidencia; la fila CSV se proyecta solo al esquema §7.2. El contrato admitido puede contener correcciones humanas, pero el canal conversacional debe poder verificar su origen y autorización. No aceptar desde LLM confianza inflada o evidencia `humano` inventada: cotejar datos con extracción/snapshot y mensajes humanos registrados.

Un registro de duplicado/rechazado no tiene éxito de alta/actualización: informar clasificación por validar y devolver error legible si se intenta registrar, sin archivado/historial. Campos desconocidos/argumentos extra se rechazan. Enumeraciones y objetos anidados JSON-schema compatibles; refinamientos calendarios/monetarios se aplican localmente. El proveedor puede devolver JSON malformado: devolver error al modelo, registrar llamada y continuar sujeto a límites.

## Runtime e interfaces internas

- `MailboxRepository`: listar/cargar mensaje/adjunto; solo fixtures. `ContractRepository`: snapshot, recuperar, registrar candidato, cerrar mensaje, alertas. `Clock`: instante y fecha de ejecución; `AuditSink`: eventos seguros. Repositorios explícitos permiten fallos controlados en tests y reúnen persistencia detrás de interfaces sin una jerarquía genérica.
- `ToolRuntime`: dependencias anteriores, política de confirmación, revisión de estado, budget; creado por bootstrap o demo e identificado por sesión. No configurable por el usuario remoto. El ctx público mínimo no cambia.
- `LlmAdapter.enviar(mensajes,herramientas) → {texto,toolCalls:[{id,nombre,argumentos}],usage:{inputTokens,outputTokens}}`; configuración, señal abort y presupuesto se inyectan en el adaptador. Nunca expone clave al runtime frontend. Mensajes normalizados system/user/assistant/tool y asociación callId se convierten dentro del proveedor.
- `AgentService`: sesión + mensaje humano → turno; valida llamadas conocidas, cuenta iteraciones, registra cada resultado, acumula hechos y detiene ante confirmación/límites/error no recuperable. No delega autorización al adaptador. Ante error de un mensaje contractual continúa con otros pendientes.

## Ciclo y confirmación

1. Cargar prompt Markdown y conocimiento separado; enviar usuario e historial controlado al adaptador. Textos de correo/documento se tratan como datos, nunca instrucciones.
2. Validar nombres/args y ejecutar herramientas serialmente; preservar callId/result para la siguiente petición. No invocar funciones fuera de cinco P0 por un nombre del modelo. Los errores son resultados, no caída del lote.
3. Acumular resultados en historial visible y log. Cuando quedan revisiones, seguir el lote limpio permitido antes de terminar el turno con pregunta explícita; ninguna operación dudosa se ejecuta en ese turno. Si el modelo intenta registrar sin autorización, el gate lo rechaza.
4. Pregunta/formulario determinista enumera campos faltantes y conflictos, candidato y mensaje. El turno humano siguiente puede corregir/aportar datos; validar contra Zod y dominio y construir confirmación ligada al hash. Si la respuesta es parcial, conservar lo confirmado y preguntar lo restante, sin inventar. Si el candidato cambia o cambia maestro, mostrar revisión nueva antes de ejecutar efectos.
5. En demo directa, el operador llama mismos tools con modo de confirmación confiable explícito y confirmado:true. Ningún endpoint permite activar ese modo. El formulario no cambia el contrato de herramientas ni crea un nuevo actor de negocio.
6. Respuesta contractual renderizada desde resultados de tools; modelo puede conducir conversación/preguntas pero no introduce valores no respaldados. Para valores aportados por usuario, validar con contratos_validar antes de afirmarlos como candidato validado. Resumen de error/límite desde estado local aunque modelo no responda.

## HTTP mínimo elegido

Mismo origen, JSON UTF-8, body máximo técnico 64 KiB. Servir solo bundle frontend; nunca fixtures, out, .env ni fuente. No endpoint shell/reset. SessionId emitido por servidor con UUID impredecible. IDs malformados → 400, inexistentes → 404; no exponer paths absolutos, stack trace, headers del proveedor ni secretos. Log correlacionado para errores.

| Método/ruta | Entrada / resultado |
| --- | --- |
| POST /api/chat | `{sessionId?:string,message:string,humanAction?:{pendingId:string,kind:"confirm"|"correct",fields?:objeto}}`. Sin sessionId crea sesión. humanAction solo afecta pendiente de esa sesión y siguiente turno humano; fields limitado a campos revisados, nunca schemas/rutas/códigos/políticas. |
| Respuesta chat 200 | `{sessionId,reply:string,toolCalls:[{id,name,args,resultSummary,ok}],needsConfirmation:boolean,pending?:{id,mensaje_id,fields,candidate},status:"completed"|"awaiting_confirmation"|"limited"|"provider_error"}`. Esquema del candidate con datos parciales, metadatos de procedencia y valores a confirmar; nunca clave. |
| GET /api/sessions/:id | `{sessionId,messages:[{role,content,toolCalls?}],needsConfirmation,pending?,status}`; historial completo visible, con argumentos sanitizados y resultados resumidos; no campos de autorización internos. |
| GET /api/health | `{ok:true,provider:"openai",model:string}` cuando servidor/configuración están listos. No llama modelo ni anuncia conectividad real; live check separado. Configuración crítica inválida → 503 con mensaje seguro. |

POST concurrente de una sesión en ejecución → 409 legible, evitar doble gasto/turnos entremezclados. Límite de presupuesto → status limited sin nueva llamada facturable; proveedor indisponible/timeout → provider_error y sesión viva. Validación HTTP inválida → 400 sin modelo. 413 para body excesivo. Sin autenticación de usuarios; no confundir opacidad de sesión con identidad/roles. Render expone HTTPS y proxy; no aceptar contexto de ejecución desde body.

## UI observable

Historial ordenado, entrada y botón enviar, estado pensando mientras turno activo, lista expandible de cada tool call con nombre/args/resumen/ok, tabla final por mensaje y reporte de alertas. Textos externos con textContent/escape, sin HTML o Markdown sin sanitización. Estado pending resaltado con pregunta y formulario de campos; confirmación genera mensaje humano explícito en historial. Errores y límites visibles con resumen de lo hecho/pendiente. Sin streaming P0; tool calls aparecen con respuesta del turno. Recargar reconstruye historial desde sessionId guardado localmente; tras reinicio puede indicarse sesión no disponible y crear nueva, manteniendo maestro y presupuesto durables.

## Fuera de P0

P1 PDF con texto: contratos_leer_pdf `{ruta}`→`{texto}` tras confinamiento, no OCR. Streaming/protección opcionales requieren no romper contrato observable. Bonus modulo usa mismas piezas fuente, no forks; no se añade endpoint ni dependencia al P0 para conseguirlo.
