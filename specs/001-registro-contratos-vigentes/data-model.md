# Data model y consistencia

Fuentes: PRD §§5–8; spec FR-002–008, FR-013, FR-019–022; Q1–Q5. Los modelos son diseño documental, no código ni migraciones.

## Entidades y validación

### Mensaje y adjunto

`correo.json`: id, de, para, asunto, fecha ISO con offset, cuerpo, adjuntos como nombres relativos. Lista pública añade `tiene_contrato:boolean`. Resolver archivos desde ctx.directory y su carpeta de mensaje; rechazar traversal, rutas absolutas y symlinks fuera de fixtures. Solo adjuntos enumerados; TXT UTF-8 P0. `otrosi.txt` es contractual, `cotizacion.txt` no. No se decide por nombre de archivo únicamente: inspección de contenido.

### Comercial

Catálogo `{email,nombre,region}[]`, email normalizado para búsqueda. `jperez@periferia-ficticia.com` no existe: advertencia no bloqueante, representación final `comercial=""` y referencia segura al remitente en diagnóstico; nunca adjudicar un nombre de otro contrato del mismo cliente. La cadena vacía expresa no resuelto, no un nombre inventado, y satisface el tipo string de §7.2. La región no determina por sí sola país contractual.

### Contrato extraído y candidato

Campos de la fila final, anulables en extracción, más `confianza:Record<campo,number>` en [0,1], `evidencia:Record<campo,{texto,origen}>`, `valor_indeterminado:boolean`, `es_otrosi:boolean` y cláusula de garantía condicional cuando existe. Origen: documento, derivación, maestro, catálogo, humano o sistema. Metadatos no se añaden como columnas CSV. Evidencia conserva solo fragmentos necesarios; no copiar documentos completos a logs. Datos de sistema (ruta, fecha_registro, fuente, ID AUTO) se completan en aplicación y no se etiquetan extraídos.

Para msg-006: valor 0 es normalización por demanda, confianza 0.75 y revisión obligatoria; fin ausente/null con evidencia del plazo, inicio null/confianza0 con evidencia agosto2026. Moneda contractual no está expresada como importe del marco: COP del umbral es evidencia parcial, no moneda final automática; pedir confirmación si no existe respaldo inequívoco. Póliza requerida/tipo/estado permanecen pendientes de interpretación humana según Q2. Confirmar valor/fin no concede esos datos ni inicio. No se añade un estado `condicional` al CSV.

El contrato final reutiliza los valores de extracción validados o correcciones humanas identificadas; el boolean confirmado nunca permite null en un campo requerido ni fechas inválidas. Un null por ausencia no es igual a texto vacío inválido: ausencia genera revisión; texto vacío del documento/fecha malformada/moneda no admitida devuelve error tipado HU-6.

### Maestro: columnas y tipos

Orden exacto del fixture:

| Columna | Validación / origen |
| --- | --- |
| id_contrato | String documental; fallback AUTO-<año_inicio>-<secuencia> con secuencia por año asignada bajo lock, a partir del máximo existente; no reutilizar en reintento. |
| cliente | String razón social contraparte documentada o confirmada. |
| nit_cliente | String normalizado; conservar ceros; eliminar separadores y DV explícito según identificador, sin cast numérico. |
| pais | CO/EC/PE/PA/HN; usar texto/identificador con evidencia, incertidumbre a revisión. |
| objeto | String ≤200 caracteres, espacio normalizado; no reemplazar objeto previo ausente en otrosí. |
| valor | Número finito sin separadores; 0 para demanda con indicador de origen, no por fallo de parseo. |
| moneda | COP/USD/PEN/PAB/HNL. |
| fecha_inicio / fecha_fin | Fecha calendario real YYYY-MM-DD; no normalizar 31 febrero silenciosamente; verificar fin no anterior a inicio. |
| requiere_poliza | Booleano serializado true/false. |
| tipo_poliza | String con lista `;`; vacío si no requiere. |
| estado_poliza | vigente/pendiente/vencida/no_aplica; alta que requiere → pendiente; si no requiere → no_aplica. En actualización conservar salvo cambio validado, no afirmar renovación inexistente. |
| comercial | String de catálogo o vacío no resuelto con advertencia; desconocido no bloqueante. |
| ruta_sharepoint | Relativa a out/sharepoint, derivada solo de segmentos seguros. |
| fecha_registro | Fecha de ejecución de alta; original en actualización (Q5). |
| fuente | buzon/manual/migracion; nuevas altas de este flujo buzon; conservar procedencia histórica no cambiada en otrosí. No añade canales manual/migración. |

CSV con encabezados exactos, UTF-8 y escape mediante csv-stringify. Comparaciones monetarias de los fixtures usan representación decimal normalizada; no redondear valores mediante LLM. Fechas solo fecha comparadas como días UTC para aritmética, fecha de ejecución calculada con reloj inyectable y zona `America/Bogota` configurable (los fixtures tienen offset -05). `hoy` de alertas sigue siendo argumento explícito, no reloj del servidor. Demo fija fecha de ejecución 2026-09-03, sin modificar fechas contractuales.

### Validación

Resultado público: clasificación nuevo/actualizacion/duplicado/rechazado, id_contrato_existente opcional, requiere_revision lista de nombres/conflictos, diferencias opcionales. Estado interno conserva candidato, revisión/hash del maestro y evidencia. Rechazo RN4 no se convierte en error técnico. Error por adjunto ilegible/fecha inválida/moneda desconocida devuelve envoltorio ok:false.

Orden: RN4 si falta contrato; localizar identidad; otrosí explícito Q3; en ordinarios RN1; luego RN2; sin coincidencia RN3. Un otrosí que no identifica contrato existente es conflicto revisable, no alta automática por inventar fila anterior. Candidatos múltiples por similitud no autorizan elegir una fila arbitraria. Cambios del otrosí se diferencian de contradicciones no explicadas: mostrar diferencias; ante conflictos HU-3 requiere revisión. Campos heredados no se borran, pero su procedencia no cambia a documento.

### Sesión y autorización

Sesión opaca aleatoria, historial, llamadas `{callId,nombre,argumentos,resultSummary,ok}`, pendientes, uso acumulado/reservas y estado idle/running/awaiting_confirmation/limited. Memoria basta para historial; presupuesto global durable sobrevive a reinicio. Una sesión no es sistema de usuarios/roles. No exponer listado de todas las sesiones.

Pendiente contiene mensaje_id, candidato canónico, hash SHA256, campos revisables, revisión del maestro, pregunta y turno humano esperado. La acción humana permite confirm/correct; no acepta parámetros de herramientas arbitrarios ni rutas. Confirmación liga el candidato exacto; cambio de datos o maestro obliga a revalidar y presentar cambios nuevos. Confianza histórica del extractor no se eleva para disimular ausencia: conservar procedencia humana como resolución de revisión separada. La revisión puede quedar listada como resuelta con evidencia, sin falsear la puntuación inicial.

## Archivos y relaciones

| Archivo | Contenido / semántica |
| --- | --- |
| out/sharepoint/maestro-contratos.csv | Copia inicial solo si ausente; luego estado operativo, ocho→hasta once filas. |
| out/sharepoint/Contratos/<año>/<slug>/<id>.<ext> | Copia exacta del adjunto válido, TXT en fixtures; ruta relativa en maestro; verificar hash al archivar. Slug minúsculas/sin acentos, espacios→guion; rechazar segmentos peligrosos/ID incompatible con ruta, sin permitir escape. |
| out/sharepoint/historial.jsonl | `{ts,id_contrato,accion,cambios,mensaje_id}`; cambios `{campo:{antes,despues}}`; una línea por alta/actualización efectiva. Correlation/transaction ID como metadatos seguros adicionales. Duplicados/rechazados no tienen línea contractual. |
| out/procesados.json | Mapa por mensaje: clasificación final, hash fuente, receipt con ID/acción/ruta si registro; motivo de cierre cuando aplica. Registro y Q4 cierran; revisión/error no cierran. |
| out/log.jsonl | Por ejecución `{ts,herramienta,mensaje_id,ok,resumen}`; mensaje_id null en herramientas agregadas, correlación, callId y referencia transacción/estado. Ninguna clave, cuerpo íntegro ni valores personales reales. Argumentos visibles en chat redactados; log guarda nombres de campos y referencias, no secretos. |
| out/alertas.md | Tres secciones exactas y fecha hoy; regeneración determinista ordenada por fecha_fin/id, luego por id para otras secciones; no altera filas ni procesados. |
| out/.transactions/ | Journal técnico y staging para recuperar escrituras, no entregable versionado. |
| out/usage.json | Presupuesto global reservado/consumido durable; no se reinicia por crear sesión ni reiniciar proceso. |

Todos los paths derivados se verifican por realpath del padre y confinamiento; ctx.directory se fija en bootstrap, nunca desde solicitud HTTP o tool args. Sin comandos shell en herramientas. Los logs de prueba/demo contienen solamente fixtures ficticios.

## Transiciones e idempotencia

- Pendiente → extraído → validado nuevo/actualización → revisión si aplica → confirmación humana → revalidación bajo lock → commit → procesado.
- Pendiente → duplicado/rechazado definitivo → cierre operativo procesado + log; sin maestro, archivo ni historial (Q4).
- Error recuperable o revisión incompleta → abierto; se continúa con el siguiente mensaje del lote.
- Mensaje ya procesado, hash de fuente igual → devolver receipt sin segunda modificación/historial; registrar nueva ejecución del tool como log. Si la fuente o candidato cambia, devolver conflicto explícito, no reaplicar el mismo mensaje por encima del receipt.
- Confirmación reutilizada o sobre otra sesión/candidato → error/pendiente, sin escritura. Dos sesiones comparten maestro pero nunca autorizaciones de confirmación.
- Solo demo/pruebas limpian out en un directorio validado y sin servidor concurrente. El servicio nunca ofrece una ruta pública de reset ni reinicia presupuestos desde chat.

## Garantías de commit y recuperación

Un mutex en proceso serializa todas las lecturas de estado y commits; un lock exclusivo de proceso impide iniciar un segundo escritor sobre out. Despliegue de una instancia. Revalidar clasificación, receipt y revisión del maestro dentro del lock; no mantener lock durante espera humana o llamada LLM.

1. Preparar contenido final y hashes en mismo filesystem: maestro, archivo, historial agregado y procesados; guardar antes/después en journal durable. Para cierre Q4 preparar solo procesados. Validación fallida no prepara cambios contractuales.
2. Registrar diagnóstico seguro de intención antes de publicar; si logging requerido no funciona, detener operación sin anunciar éxito. Publicar por rename de temporales, guardar commit marker y resultado/receipt. Lectores bajo lock no ven estado parcial.
3. Fallo previo a marker: restaurar imágenes anteriores; reportar fallo. Si rollback falla, bloquear mutaciones/lecturas del maestro con error recuperable hasta recovery; no servir datos parciales como válidos.
4. Arranque: antes de listen, recuperar journals sin marker revirtiendo y con marker completando/verificando hashes. Reconstruir resultado desde receipt para respuesta perdida tras commit. Interrumpir arranque si no se puede recuperar, sin copiar fixtures sobre estado dudoso.
5. Historial completo se publica como snapshot con la nueva línea: semántica append, no truncado de líneas anteriores. Log de resultado se coordina con journal/receipt para no perder evidencia de éxito; si respuesta HTTP se pierde después del commit, reintento no duplica contrato ni historial. Tests inyectan fallo en cada publicación y después de marker.

Garantía: consistencia de las operaciones expuestas por la aplicación y recuperación ante caída; no atomicidad observada por lectores externos que abran archivos mientras se publica, ni exactamente una línea de log por reintento. Herramientas directas usan mismo repositorio/lock/recovery, no escriben CSV por fuera. No hay promesa de atomicidad con OpenAI ni de replay idéntico del modelo.

Al actualizar un contrato, la ruta exigida contiene la versión activa del adjunto, con archivo previo respaldado hasta commit. Historial conserva cambios, no se inventa un requisito de conservar todos los documentos históricos; esa limitación se declara en SOLUCION. Backup externo de out antes de redeploy permite recuperar revisión anterior y archivos juntos. Nunca revertir solamente CSV y dejar historial/procesados de otra revisión.

## Alertas esperadas con fecha controlada

`hoy=2026-09-03`: vencen en [0,60] días los contratos `CT-2026-004` (2026-10-15) y `CT-2026-009` (2026-09-30). `CT-2025-018` y `CT-2026-002` ya vencieron y se excluyen; `CT-2026-012` queda fuera por >60 días. Pólizas pendientes tras registrar msg-001: `CT-2026-004` y `CT-2026-015`; msg-006 solo se agrega si la revisión humana confirma obligación, no por defecto. El otrosí no acredita renovación de pólizas ni cambia automáticamente vigente a pendiente.

Con fecha de ejecución fija 2026-09-03, sección desde corte incluye `CT-2026-015`, `CT-2026-016` y, solo después de completar/confirmar, `CM-2026-03`; `CT-2026-011` mantiene fecha_registro 2026-05-05 y no se incluye por haber sido actualizado. Corroborar estas expectativas en demo/tests sin reloj real.
