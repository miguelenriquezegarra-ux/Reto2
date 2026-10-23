# Feature Specification: Registro de Contratos Vigentes

**Feature Branch**: `main` (sin cambio de rama; no hay hook de creación instalado)

**Created**: 2026-10-22

**Status**: Clarified — listo para Plan; discrepancia de §11 documentada y tratamiento acordado

**Input**: Una única feature que cubre de extremo a extremo el PRD v2.0, «Registro de Contratos Vigentes», sus seis historias y la aplicación conversacional completa.

**Fuentes**: [PRD](../../PRD.md), [Constitución v2.0.0](../../.specify/memory/constitution.md), maestro, comerciales y todos los archivos de los seis mensajes de `fixtures/reto-02/`. Las referencias § corresponden al PRD, salvo indicación expresa. Los detalles técnicos aquí conservados son contratos o restricciones exigidos por esas fuentes; no son selecciones de diseño adicionales.

## Clarifications

### Session 2026-10-22

- Q: ¿Cómo debe completarse la fecha de inicio de `msg-006`, cuyo contrato solo indica que se firmó en agosto de 2026? → A: Opción A. No inferir ni completar un día arbitrario; conservar «agosto de 2026» como evidencia parcial, mantener `fecha_inicio=null`, confianza `0` y pendiente de precisión, y solicitar al usuario la fecha exacta cuando sea necesaria para registrar. Conservar `nuevo`, revisión obligatoria de `valor` y `fecha_fin` y registro solo tras confirmación humana. Documentar la ambigüedad entre la fecha inicial obligatoria y la confirmación limitada del ejemplo §11, sin modificarla silenciosamente.

- Q: ¿Cómo debe representarse la póliza de `msg-006`, exigida únicamente para órdenes de servicio superiores a COP 100 millones? → A: Opción C. Conservar la condición como evidencia y mantener la aplicabilidad pendiente de revisión humana; solicitar confirmación de su representación antes de registrar. No asignar automáticamente `requiere_poliza=true`/`pendiente` ni `requiere_poliza=false`/`no_aplica`.

- Q: ¿Qué regla debe prevalecer cuando un documento cumple simultáneamente las condiciones de duplicado y actualización? → A: Opción A. Un otrosí explícito se clasifica como actualización; para documentos ordinarios se aplica primero RN1 y después RN2. Un otrosí sigue siendo actualización aunque repita los cuatro campos de RN1; una distinta redacción del objeto no cambia el duplicado `msg-004`. Esta precedencia no autoriza registrar sin validación ni confirmación cuando corresponda.

- Q: ¿Deben los mensajes clasificados como duplicados o rechazados marcarse como procesados para que no reaparezcan entre los pendientes? → A: Opción A. Marcar ambos como procesados en `out/procesados.json` y registrar resultado/motivo en el log obligatorio, sin modificar maestro, archivar adjuntos ni añadir historial contractual. Los casos pendientes de confirmación o con errores recuperables permanecen abiertos. «Sin escritura» de RN1 se refiere a efectos contractuales y no impide estas escrituras operativas.

- Q: ¿Qué política de fechas debemos aplicar al registro y al reporte de vencimientos? → A: Opción A. En altas, usar fecha de ejecución, controlada en demo/pruebas; en actualizaciones, conservar `fecha_registro` original y fechar el cambio en historial. Vencimientos: `0 ≤ días hasta vencimiento ≤ 60`, inclusive. Mantener las otras dos secciones y el argumento explícito `hoy`.

Las cinco respuestas definen el comportamiento acordado sin modificar el PRD ni los fixtures. La discrepancia de §11 permanece como limitación documental conocida, con tratamiento ejecutable Q1–Q2: solicitar y validar los datos pendientes antes de registrar. No se inventa una fecha o decisión de póliza para cerrar el ejemplo.

## User Scenarios & Testing *(mandatory)*

La analista administrativa es la usuaria principal; gerencia consume el reporte. El comercial envía documentos al buzón simulado, sin usar el agente; aseguradora/corredor quedan fuera del sistema (§4). Todas las historias siguientes son P0 obligatorias, verificables aisladamente con entradas controladas, pero juntas constituyen una sola entrega. P1 conserva exclusivamente el sentido opcional asignado por el PRD.

### User Story 1 - Leer el buzón (Priority: P0; HU-1)

Como analista quiero conocer los mensajes pendientes y sus adjuntos para decidir qué procesar.

**Why this priority**: Es la entrada única para registrar contratos con o sin póliza (O1).

**Independent Test**: Consultar el buzón con un registro de procesados controlado y comparar todos los metadatos con los seis `correo.json`.

**Acceptance Scenarios**:

1. **Given** los seis mensajes sin procesar, **When** solicito pendientes, **Then** recibo los seis con `id`, `de`, `asunto`, `fecha`, `adjuntos[]` y `tiene_contrato`.
2. **Given** un mensaje incluido en `out/procesados.json`, **When** vuelvo a consultar, **Then** ese mensaje no figura entre los pendientes.
3. **Given** `msg-005` con `cotizacion.txt`, **When** se inspecciona, **Then** `tiene_contrato=false` y se informa `rechazado` con motivo; una cotización no se registra como contrato. Una vez clasificado definitivamente, se marca procesado y se registra el motivo en el log, sin archivado ni historial contractual (Q4).

### User Story 2 - Extraer datos con confianza (Priority: P0; HU-2)

Como analista quiero datos estructurados con confianza por campo para evitar la lectura manual completa y reconocer incertidumbres.

**Why this priority**: La extracción verificable sustenta la calidad del maestro (O2–O3).

**Independent Test**: Ejecutar extracción sin modelo sobre los textos entregados y verificar valores, procedencia y confianza.

**Acceptance Scenarios**:

1. **Given** los contratos legibles `msg-001` y `msg-002`, **When** se extraen, **Then** se devuelven los campos de §7.2, con confianza de cada campo en `[0,1]`, diferenciando correctamente valores COP/USD y requisitos de póliza.
2. **Given** un campo ausente del texto, **When** se extrae, **Then** es `null` con confianza `0`; no se inventa. La derivación de plazo permitida en §7.2 debe distinguirse de un valor explícito.
3. **Given** `msg-006`, **When** se extrae, **Then** se reconoce valor indeterminado/por demanda y plazo de doce meses desde la firma, se presentan valor y fecha final para revisión y se conserva «agosto de 2026» como evidencia parcial de la firma; `fecha_inicio=null`, confianza `0`, pendiente de precisión. No se infiere el día a partir del correo, del fin confirmado ni de un día arbitrario; se solicita la fecha exacta para registrar.
4. **Given** enriquecimiento propuesto por el modelo, **When** se considera registrar, **Then** el valor final pasa por `contratos_validar`; el modelo no sustituye a la herramienta.

### User Story 3 - Validar y clasificar (Priority: P0; HU-3)

Como analista quiero distinguir nuevos, actualizaciones, duplicados y rechazados para proteger el maestro.

**Why this priority**: Impide duplicados y modificaciones incorrectas (O2).

**Independent Test**: Comparar cada extracción con una copia controlada del maestro inicial, sin necesidad de chat ni modelo.

**Acceptance Scenarios**:

1. **Given** el maestro inicial, **When** se validan los seis mensajes, **Then** se obtienen las clasificaciones de la tabla de fixtures de esta especificación.
2. **Given** campos con confianza inferior a `0.8` o conflictos con el maestro, **When** se valida, **Then** `requiere_revision[]` enumera los campos y conflictos; `0.8` no es inferior al umbral.
3. **Given** un remitente del catálogo, **When** se valida, **Then** se resuelve su nombre desde `comerciales.json`; el remitente desconocido de `msg-006` se reporta sin bloquear por ese solo motivo.
4. **Given** identidad coincidente por contrato o por NIT y objeto, **When** se clasifica, **Then** se aplican RN1–RN4 y se informan identificador existente y diferencias cuando corresponda. Un otrosí explícito es actualización; para documentos ordinarios, RN1 precede a RN2, de modo que `msg-004` es duplicado aunque su objeto tenga otra redacción.
5. **Given** un otrosí explícito con los mismos identificador, valor, inicio y fin que el maestro, **When** se clasifica, **Then** es actualización conforme a Q3; clasificar no dispensa validar ni confirmar los cambios pendientes.

### User Story 4 - Registrar y archivar con confirmación (Priority: P0; HU-4)

Como analista quiero registrar contratos limpios y confirmar los dudosos, conservando archivo e historial.

**Why this priority**: Completa el registro sin convertir baja confianza en datos malos (O1–O3).

**Independent Test**: Invocar registro directamente con datos validados y con revisión pendiente; comprobar maestro, archivo, historial y estado procesado. Verificar por separado la conversación de confirmación.

**Acceptance Scenarios**:

1. **Given** un contrato nuevo sin revisión pendiente, **When** se registra, **Then** se inserta una fila en la copia del maestro, se archiva el adjunto, se añade historial y se marca el mensaje procesado; los fixtures quedan intactos.
2. **Given** el otrosí de `msg-003`, **When** se aplica la actualización validada, **Then** cambia la fila de `CT-2026-011`, incluyendo valor `520000 PEN` y fin `2027-11-01`, conservando historial y sin insertar otra fila del contrato.
3. **Given** `msg-006` pendiente, **When** se intenta registrar sin `confirmado=true`, **Then** se rechaza la escritura con motivo legible; el agente termina el turno preguntando explícitamente y el chat resalta la confirmación pendiente.
4. **Given** esa pregunta, **When** el siguiente mensaje del usuario confirma los valores, **Then** se permite la llamada confirmada para esos valores; el modelo no puede autorizar por sí mismo ni completar datos faltantes. El ejemplo §11 confirma valor `0` y fin `2027-08-31` y declara que se registra `msg-006`, pero no proporciona el inicio exacto exigido por §7.2. Esta discrepancia de aceptación queda documentada: confirmar esos dos valores no aporta por sí solo una fecha inicial. Solicitar su precisión antes de registrar, conservando la clasificación `nuevo` y la revisión obligatoria de valor y fin.
5. **Given** `msg-004`, **When** se determina duplicado, **Then** se reporta sin modificar maestro, archivar adjunto ni añadir historial contractual; se marca procesado y se registra el resultado en el log obligatorio (Q4).
6. **Given** duplicados y rechazados ya cerrados, **When** se repite la consulta del buzón sin reinicializar `out/`, **Then** no aparecen como pendientes y no se repiten sus efectos contractuales; los casos pendientes de confirmación y los errores recuperables permanecen abiertos (Q4).

### User Story 5 - Consultar riesgos (Priority: P0; HU-5)

Como gerencia quiero ver vencimientos y pólizas pendientes para actuar oportunamente.

**Why this priority**: Hace visible el riesgo y el avance de cobertura del gap (O4).

**Independent Test**: Ejecutar alertas con maestro controlado y `hoy=2026-09-03`, y comprobar las tres secciones y resultados estructurados.

**Acceptance Scenarios**:

1. **Given** una fecha de referencia explícita, **When** se solicitan alertas, **Then** `out/alertas.md` contiene contratos que vencen en ≤60 días, contratos con póliza requerida y estado distinto de `vigente`, y registrados desde `2026-05-30`.
2. **Given** contratos que finalizan hoy, exactamente a 60 días, a 61 días y antes de hoy, **When** se genera el reporte, **Then** los dos primeros se incluyen en vencimientos y los otros dos se excluyen de esa sección, según Q5. Las otras categorías se evalúan independientemente.
3. **Given** el reporte generado, **When** el agente responde, **Then** muestra su resumen a partir de los resultados de herramientas.
4. **Given** un alta y una actualización ejecutadas en una fecha controlada, **When** se registran y se consulta el reporte desde `2026-05-30`, **Then** el alta usa esa fecha de ejecución y la actualización conserva la fecha de alta original; el cambio queda fechado en historial. La sección de registrados desde el corte se determina por `fecha_registro >= 2026-05-30`, no por la última modificación.

### User Story 6 - Continuar ante errores (Priority: P0; HU-6)

Como analista quiero errores claros y continuidad del procesamiento para que un mensaje malo no impida revisar los demás.

**Why this priority**: Es necesario para procesar el buzón completo y mantener una sesión útil.

**Independent Test**: Proporcionar texto vacío, fecha inválida y moneda desconocida, junto a un mensaje válido; simular también error y timeout del proveedor.

**Acceptance Scenarios**:

1. **Given** cualquiera de esas entradas inválidas, **When** se ejecuta la herramienta, **Then** devuelve `{ok:false,error}` legible sin lanzar una excepción hacia su consumidor y el lote continúa.
2. **Given** un error de herramienta o proveedor, **When** ocurre durante el chat, **Then** se informa en lenguaje claro y la sesión permanece disponible.
3. **Given** el límite de iteraciones alcanzado, **When** el agente termina el turno, **Then** informa lo realizado y lo pendiente. Al agotarse el presupuesto de tokens o expirar el proveedor se informa la causa, sin continuar consumo por encima del límite ni afirmar resultados no obtenidos.

### Escenario integral de conversación (§§6, 11)

En una sesión nueva la analista pide: «Procesa el buzón de contratos con fecha de hoy 2026-09-03. Registra lo que esté limpio, muéstrame lo que requiere revisión campo por campo y termina con el reporte de alertas. No registres nada dudoso sin preguntarme».

El chat presenta historial, entrada e indicador de pensando, hace visible cada llamada (nombre, argumentos y resumen del resultado), entrega una tabla por mensaje con clasificación/acción, muestra la revisión de `msg-006`, termina el turno con pregunta y muestra el resumen de alertas. La continuación de §11 «confirmo el valor 0 y la fecha fin 2027-08-31» confirma esos dos valores. El PRD espera entonces el registro; existe una ambigüedad porque no aporta el inicio exacto obligatorio. Según la decisión Q1 se conserva ese escenario como expectativa documental y se solicita el dato faltante antes de ejecutar el registro, sin inventarlo ni declarar que el ejemplo por sí solo completa todos los datos. El historial de sesión se conserva en memoria o archivo; streaming es opcional.

### Edge Cases

- Sin adjunto contractual o sin partes y objeto identificables: rechazo motivado (RN4); una cotización con importe no es contrato.
- Campos ausentes, fecha derivada o valor por demanda: no inventar; distinguir dato ausente, normalización y propuesta pendiente de confirmación.
- Identificador tributario con puntos/dígito de verificación, monedas con separadores distintos y objeto de más de 200 caracteres: satisfacer §7.2 sin usar al LLM como autoridad.
- Mismo cliente con objetos distintos (`msg-001` y `msg-002` frente al maestro): no basta el nombre del cliente para duplicar/actualizar; usar RN1–RN3.
- Otrosí parcial: conservar los datos no modificados del maestro conforme a la cláusula del fixture; no presentarlos como extraídos del otrosí ni borrar por ausencia textual. Validar modificaciones y confirmar conflictos cuando corresponda; clasificar como actualización no acredita que las garantías ya se hayan ampliado.
- Reintento de registro, transición conflictiva o fallo entre maestro, archivo, historial y procesados: preservar invariantes y declarar resultado/fallo, sin duplicar filas; garantías y recuperación se concretarán en Plan conforme a Constitución III.
- Argumentos inválidos, modelo que propone `confirmado=true` sin confirmación humana y rutas no autorizadas: la validación y los límites de operación deben impedir eludir controles.
- Fecha de referencia, corte `2026-05-30` y frontera de 60 días: entradas controladas; vencimientos incluyen hoy y día 60, excluyen vencidos y día 61. Una actualización no convierte la fecha original de alta en fecha de modificación (Q5).
- Reejecución de demo: limpiar `out/` al inicio sin tocar fixtures; los resultados deben repetirse salvo timestamps.

## Requirements *(mandatory)*

### Functional Requirements

Cada fila es obligatoria P0 salvo la sección opcional. Las referencias forman la trazabilidad al PRD; «C» identifica un requisito constitucional adicional ya vigente.

| ID | Requisito verificable | Fuente / aceptación |
| --- | --- | --- |
| FR-001 | Entregar agente conversacional completo e independiente con chat, backend, ciclo con modelo y herramientas, funcional localmente y desde URL pública. | §§0, 6.1, 9.3; escenario integral |
| FR-002 | Listar solo pendientes de `fixtures/reto-02/buzon/` según `out/procesados.json`, con todos los campos HU-1. | §5 HU-1; historia 1 |
| FR-003 | Extraer determinísticamente de texto mediante reglas/heurísticas, devolver esquema §7.2 con confianza por campo `[0,1]`; ausencias `null/0`, sin invención; enriquecimiento LLM permitido solo con validación final. | §5 HU-2; historia 2 |
| FR-004 | Validar entradas, invariantes, clasificación, diferencias y campos/conflictos de revisión; resolver comerciales conocidos y reportar desconocidos sin bloqueo automático. | §5 HU-3, §§7.2–7.3; historia 3 |
| FR-005 | Aplicar íntegramente RN1–RN7 descritas abajo, sin sustituir reglas por criterio del modelo. | §7.3; historias 1–6 |
| FR-006 | Registrar solo si no hay revisión o `confirmado=true`; escribir/actualizar copia del maestro, archivar adjunto y guardar ruta, añadir historial y marcar mensaje procesado. | §5 HU-4; historia 4 |
| FR-007 | Generar `out/alertas.md` y resultado con las tres categorías HU-5 usando `hoy` explícito. | §5 HU-5; historia 5 |
| FR-008 | Devolver errores legibles, tipados y sin lanzamiento en herramientas; continuar con siguientes mensajes ante fallos individuales. | §5 HU-6, §§6.2, 8; historia 6 |
| FR-009 | Mostrar historial, entrada, pensando, todas las llamadas con nombre/argumentos/resumen y confirmación resaltada; mantener sesión en memoria o archivo. | §6.1, CA3–CA5; escenario integral |
| FR-010 | Ejecutar prompt → modelo → herramientas → respuesta, con límites configurables de iteraciones por turno y tokens por sesión, timeout al proveedor y resultados observables al llegar a límites o indisponibilidad. El valor 25 es sugerencia, no obligación. | CA1, CA5, §8; C VII; historia 6 |
| FR-011 | No afirmar valores que no provengan de herramientas; permitir propuestas del modelo solo por validación y confirmación aplicables. | §6.1, CA2, §10; historias 2 y 4 |
| FR-012 | Terminar turno con pregunta explícita cuando se requiere confirmación; proceder únicamente si confirma el siguiente mensaje humano. Enforzar el control en ejecución, independientemente del llamador. | CA3; C IV; historia 4 |
| FR-013 | Registrar toda llamada visible en chat y en `out/log.jsonl`, con `{ts,herramienta,mensaje_id,ok,resumen}`; añadir correlación y referencias seguras para operaciones/cambios significativos, sin secretos ni valores sensibles. | CA4, RN7; C VI |
| FR-014 | Exponer API de chat y acceso al historial y estado del servicio, documentados en README. §6.4 ofrece como referencia `POST /api/chat` con `{sessionId,message}` → `{reply,toolCalls[],needsConfirmation}` o eventos, `GET /api/sessions/:id` y `GET /api/health` → `{ok:true,provider,model}` sin claves; el diseño exacto es libre. | §6.4 |
| FR-015 | Mantener interfaz LLM propia `enviar(mensajes,herramientas) → respuesta`, con proveedor elegible y reemplazable sin tocar el ciclo. Separar comportamiento, conocimiento y ejecución; cambios de reglas no deben exigir modificar servidor. | §§6.1, 6.5 |
| FR-016 | Ofrecer herramientas tipadas, independientes del HTTP, importables y ejecutables directamente sin LLM, respetando íntegramente el contrato obligatorio siguiente. | §§6.1–6.2 |
| FR-017 | Demo sin clave/modelo: procesar en orden los seis mensajes, imprimir clasificación, campos en revisión y acción, dejar pendientes sin registrar en primera pasada y mostrar segunda llamada confirmada para uno. Limpiar `out/` al inicio; mismo resultado en ejecuciones consecutivas salvo timestamps; salir con fallo si verificación falla. | §6.6, §8; C V |
| FR-018 | Entregar documentación, configuración y paquete conforme a los requisitos de entrega siguientes. | §§7.5, 9 |
| FR-019 | Para `msg-006`, conservar evidencia parcial de firma «agosto de 2026» y `fecha_inicio=null` con confianza `0` hasta obtener precisión humana; no inferir día. Solicitar fecha exacta para registrar, manteniendo `nuevo` y revisión obligatoria de valor y fin. La confirmación de §11 no resuelve por sí sola el inicio: registrar esta discrepancia expresamente. | HU-2, §7.2, §7.4, §11; decisión Q1 |
| FR-020 | Para `msg-006`, conservar la cláusula de póliza condicionada a órdenes superiores a COP 100 millones como evidencia; mantener su aplicabilidad pendiente en `requiere_revision` y solicitar confirmación humana de los campos de póliza antes de registrar. No asignar automáticamente obligación inmediata ni `no_aplica`. La fila definitiva debe satisfacer §7.2 tras esa revisión; no se añade un nuevo estado de póliza al maestro. | HU-2–HU-4, §7.2, cláusula CUARTA del fixture; decisión Q2 |
| FR-021 | Cerrar duplicados y rechazados definitivos marcándolos en `out/procesados.json`, con resultado/motivo en `out/log.jsonl`, sin cambios de maestro, archivado ni historial contractual. No cerrar pendientes de confirmación ni errores recuperables. Reconsultar pendientes no vuelve a incluir los mensajes cerrados. | HU-1, RN1, RN4, RN7; decisión Q4 |
| FR-022 | Usar fecha de ejecución para `fecha_registro` de altas, con fecha controlada en demo/pruebas; preservarla al actualizar y fechar cambios en historial. La sección desde el corte filtra `fecha_registro >= 2026-05-30`; vencimientos filtra `0 ≤ fecha_fin - hoy ≤ 60` en días calendario, con extremos incluidos. No cambiar las otras categorías de alertas. | HU-5, §7.2, §8; decisión Q5 |

### Reglas de negocio obligatorias (FR-005)

| Regla | Comportamiento conservado del PRD §7.3 |
| --- | --- |
| RN1 | Mismo `id_contrato`, `valor`, `fecha_inicio` y `fecha_fin`: `duplicado`; no se escribe nada contractual y se reporta. En documentos ordinarios precede a RN2; un otrosí explícito se clasifica primero por RN2 (Q3). Se permiten y exigen marcado procesado y log operativo, sin maestro, archivado ni historial contractual (Q4). |
| RN2 | Mismo `id_contrato` o mismo `nit_cliente` + objeto con similitud ≥0.9 y algún campo distinto, o documento identificado como otrosí: `actualizacion`; modificar fila y conservar cambio en `historial.jsonl`. Precedencia Q3: otrosí explícito primero; en documentos ordinarios RN1 y después RN2. La definición técnica de similitud se concretará y verificará en Plan sin alterar el umbral del PRD. |
| RN3 | Sin coincidencia: `nuevo`, insertar. |
| RN4 | Sin adjunto contractual o texto sin partes ni objeto identificables: `rechazado` con motivo. |
| RN5 | Confianza <0.8: añadir a `requiere_revision`; registro sin `confirmado=true` rechaza esos campos. |
| RN6 | Maestro fixture de solo lectura; copiarlo en primera ejecución a `out/sharepoint/maestro-contratos.csv`. |
| RN7 | Toda ejecución deja `out/log.jsonl` con `{ts,herramienta,mensaje_id,ok,resumen}`. |

### Contrato obligatorio de herramientas (FR-016; §6.2)

Entrada pública en `src/tools/contratos.ts`; nombre visible `<archivo>_<export>`. Cada export contiene `description` de una frase precisa, `args` como objeto de esquemas Zod con `.describe()` por campo y `execute(args,ctx)` asíncrono. `ctx={directory:string,sessionId:string}`; resolver rutas desde la raíz indicada por `directory`, sin rutas absolutas codificadas. Validar argumentos antes de ejecutar y devolver errores al modelo. Cada ejecución devuelve un **string JSON** `{ok:true,data}` o `{ok:false,error}`; nunca lanza. Implementaciones pueden delegarse sin alterar esos exports.

| Nombre / export | Entrada | `data` de éxito |
| --- | --- | --- |
| `contratos_leer_buzon` / `leer_buzon` | `{}` | `{mensajes[]}` con los campos HU-1 |
| `contratos_extraer` / `extraer` | `{mensaje_id}` | `Contrato` con confianza por campo |
| `contratos_validar` / `validar` | `{mensaje_id,contrato}` | `{clasificacion,id_contrato_existente?,requiere_revision[],diferencias?}` |
| `contratos_registrar` / `registrar` | `{mensaje_id,contrato,confirmado?:boolean}` | `{id_contrato,accion,ruta_archivo}`; fallo de revisión: `{ok:false,error:"requiere revisión: ..."}` como envoltorio de error |
| `contratos_alertas` / `alertas` | `{hoy:"YYYY-MM-DD"}` | `{ruta,vencen[],polizas_pendientes[],registrados_desde_corte[]}` |

Archivar en `out/sharepoint/Contratos/<año_inicio>/<cliente-slug>/<id_contrato>.<ext>` y guardar ruta relativa a `out/sharepoint/`. Historial en `out/sharepoint/historial.jsonl`: `{ts,id_contrato,accion,cambios,mensaje_id}`. Los adjuntos reales son TXT; no se exige fabricar PDF ausentes.

### Restricciones no funcionales y de ingeniería

| ID | Restricción y evidencia requerida | Fuente |
| --- | --- | --- |
| NFR-001 | TypeScript en frontend/backend, backend y tooling en Node.js 20+, sin `any`, funciones cortas y nombres consistentes. Framework/frontend/proveedor/hosting quedan para Plan, justificados; no se selecciona base de datos. | §0, §8; C I y restricciones técnicas |
| NFR-002 | Memoria/archivos en `out/`; CSV maestro y carpetas locales simulan SharePoint/buzón. Fixtures inmutables. Sin Exchange/SharePoint reales, revisión jurídica, OCR, ejecución de reconstrucción junio–agosto, autenticación/roles/multiusuario como alcance obligatorio. | §§2.3, 3.2, 6.1 |
| NFR-003 | Un comando inicia frontend y backend en menos de dos minutos en máquina limpia con variables documentadas en `.env.example`. Instalación/build/verificación reproducibles con runtime declarado y lockfile versionado. | §8; C VII |
| NFR-004 | Clave solo en variable de entorno del backend; nunca en frontend, repositorio, logs ni respuestas API. Sin credenciales ni datos personales reales en la entrega; herramientas sin ejecutar shell. Proteger datos sensibles y limitar acceso/operaciones sin imponer autenticación fuera de alcance. | §§0, 8; C IV |
| NFR-005 | Validar fronteras con Zod, incluidos argumentos, solicitudes, integraciones y salidas estructuradas del modelo. Separar dominio determinista, orquestación, presentación, infraestructura, integraciones y persistencia por interfaces; LLM no es autoridad de invariantes/transiciones. | §§6.1–6.2; C I–III |
| NFR-006 | Los topes de iteraciones por turno y tokens por sesión son configurables y limitan consumo; timeout y errores claros conservan sesión. No se inventa presupuesto numérico: valores, mecanismos y verificación se definen en Plan. | §8, CA1, CA5; C VII |
| NFR-007 | Verificación automatizada controlada de extracción, validación, invariantes, duplicados, conflictos, confirmación y seguridad aplicable; dominio, integraciones y orquestación verificables independientemente; respuestas de modelo controladas en pruebas reproducibles. | C II, III y V; §8 |
| NFR-008 | Release: typecheck, build reproducible, suite completa, demo sin LLM, URL pública con front/backend/agente funcional y breve comprobación real del modelo desplegado con credenciales/conectividad/configuración, presupuesto acotado y criterios definidos en Plan. Registrar revisión fuente, resultados y URL. | C V, VII; gates 6 y 8; §9.3 |
| NFR-009 | Revisiones y aprobaciones registradas conforme a Constitución: impacto, justificación, evidencia, migración/recuperación cuando corresponda; aprobación explícita del dueño para cambios significativos antes de merge/release. Ninguna fase posterior puede dispensar un MUST sin enmienda aprobada. | C gates 7 y Governance |

### Entrega y documentación (FR-018)

- `agent/prompt.md`, `src/tools/contratos.ts`, `demo.ts` y `SOLUCION.md` son obligatorios. Conocimiento del proceso separado en `src/knowledge/`; §6.5 sugiere `registro-contratos.md` y una estructura de repositorio, sin imponer todos sus nombres como contratos.
- `SOLUCION.md` conserva las once partes de §9.1: problema y afectado; diagrama y separación prompt/conocimiento/ejecución; ciclo, límites y confirmación; proveedor/modelo/justificación/costo estimado por caso; extracción/confianza/papel del modelo; regla de gobierno; mínimo tres decisiones con alternativas descartadas; supuestos; cobertura HU con hecho/parcial/no hecho y brechas a producción; asistentes IA usados, tareas y propuestas descartadas con razón; riesgos y mitigación. Costos indican supuestos de modelo/uso y base de estimación (C VIII). Dependencias justificadas (§8); documentación acorde al comportamiento implementado.
- Regla de gobierno de una página (§7.5): buzón y administrador; documentos exigidos al comercial (PDF firmado, otrosíes, actas de terminación), plazo y asunto; acuse y tiempo; excepciones por falta de firma/valor y escalamiento; campaña única de reconstrucción junio–agosto de 2026 **solo propuesta**; indicador mensual. No se inventa un responsable organizacional: debe definirse en la propuesta (§10).
- `README.md`: comando único local, entorno, demo, API, URL pública y clave de acceso si se protege el enlace. `.env.example` sin valores de credenciales; procedimientos de despliegue, verificación y recuperación documentados (C VII).
- URL pública activa durante la defensa (§9.3). El PRD acepta defensa local con penalización de -10; esa alternativa no satisface el gate constitucional de release público.
- Entrega por repositorio Git con historial o `reto-02-<apellido>.zip`, excluyendo `node_modules/`, `out/` y `.env` (§9.5).
- §0 menciona aprobación de 70/100 según una rúbrica supuestamente en §10. El §10 disponible contiene riesgos/supuestos/preguntas, sin pesos ni rúbrica. No se inventan puntos ni criterios de evaluación ausentes.

La revisión de entregables se acepta mediante la evidencia siguiente; no basta la mera existencia de los archivos. Esta tabla especifica verificaciones de entrega futuras, sin generar ahora los entregables.

| Entregable obligatorio | Evidencia de aceptación | Trazabilidad |
| --- | --- | --- |
| `SOLUCION.md` | Revisión de las once secciones enumeradas arriba; al menos tres trade-offs con alternativas; extracción/confianza y costo por caso explicados; cobertura de seis HU; uso y descarte de propuestas de IA; riesgos y supuestos acordes al producto. La propuesta de gobierno ocupa una página y responde a los seis puntos de §7.5. | FR-018, §9.1, §7.5, C VIII |
| `README.md` y `.env.example` | Desde entorno limpio, seguir las instrucciones inicia front/backend con un comando en menos de dos minutos; las variables requeridas están descritas, sin valores secretos; los comandos de demo y API documentados corresponden al comportamiento; el enlace y acceso opcional permiten evaluar. | FR-014, FR-018, NFR-003–004, §9.2 |
| `demo.ts` | Ejecutar dos veces sin claves LLM y con fecha controlada, limpiando solo `out/`: procesar en orden los seis casos y comparar clasificación, revisión y acción salvo timestamps. Primera pasada no registra pendientes; segunda llamada confirmada demuestra un caso tras aportar los datos necesarios. Para `msg-006`, la entrada humana de demostración se declara como tal, nunca como dato extraído del fixture; respeta Q1–Q2 y no modifica fixtures. Fallar si las verificaciones no se cumplen. | FR-017, FR-019–020, §§6.6, 8; C V |
| Aplicación conversacional completa | Ejecutar el escenario integral con frontend, backend y proveedor real: historial, pensando, todas las llamadas visibles y registradas, valores respaldados por herramientas, pausa para confirmación humana, continuidad ante errores y límites. La integración real es independiente de las pruebas controladas y de la demo sin modelo. | FR-001, FR-009–016, NFR-006–008, §§6, 11 |
| Despliegue y URL de evaluación | Comprobar desde el enlace público frontend, backend y una interacción representativa con modelo real, con límites de costo y criterios definidos en Plan; registrar revisión fuente, resultados y URL; disponibilidad durante la defensa. | NFR-008, §9.3; C gates 6 y 8 |
| Código fuente y entrega | Para la modalidad de repositorio solicitada en esta revisión, inspeccionar fuentes e historial de commits que identifique los cambios entregados, sin imponer número de commits ni una rúbrica ausente. Verificar exclusión de secretos, `.env`, `node_modules/` y `out/` en el material entregado y ausencia de credenciales comprometidas en historial. Se conserva como alternativa del PRD el ZIP de §9.5, sin presentarlo como repositorio con historial. | Solicitud de Clarify; §§0, 8, 9.5; NFR-004 |

### Alcance opcional, separado de P0

- **P1 opcional**: `contratos_leer_pdf` / `leer_pdf`, entrada `{ruta}`, salida `{texto}`; lectura de PDF nativo con texto (§§3.2, 6.2). OCR sigue excluido.
- **Opcional sin obligación P1**: streaming y protección del enlace con acceso documentado (§§6.1, 9.2). No reemplazan ningún P0.
- **Bonus hasta +10** (§9.4): `modulo/agent.md` con frontmatter `description`, `mode: primary`, `permission {edit: deny, bash: deny}` y cuerpo system prompt; `modulo/tools/contratos.ts` importable sin servidor; `modulo/skill/registro-contratos/SKILL.md` con frontmatter `name`, `description` y conocimiento. Deben ser las mismas piezas de la aplicación, sin copias divergentes. No se convierte el bonus en requisito de aceptación base.

### Key Entities *(include if feature involves data)*

- **Mensaje**: metadatos HU-1, cuerpo y adjuntos de `correo.json`; relación con clasificación, contrato, trazas y estado procesado. `msg-003` adjunta `otrosi.txt`; `msg-005`, `cotizacion.txt`; los otros cuatro, `contrato.txt`.
- **Contrato extraído**: valores y confianza por campo; dato ausente `null/0`, revisión pendiente y propuestas diferenciadas. Su representación de extracción no elimina campos de la fila final por falta de texto.
- **Fila maestra**: exactamente los encabezados siguientes de §7.2, una fila por contrato; no se añade silenciosamente una columna para metadatos de extracción.

| Campo | Tipo / regla §7.2 |
| --- | --- |
| `id_contrato` | Identificador documental; si falta, `AUTO-<año>-<secuencia>` |
| `cliente` | Razón social contraparte |
| `nit_cliente` | Identificador sin puntos ni dígito de verificación; conservar como string |
| `pais` | `CO`, `EC`, `PE`, `PA` o `HN`, inferido de identificador/texto |
| `objeto` | String, máximo 200 caracteres |
| `valor` | Número sin separadores; `0` por demanda con `valor_indeterminado=true` como indicador de extracción, no columna nueva |
| `moneda` | `COP`, `USD`, `PEN`, `PAB` o `HNL` |
| `fecha_inicio`, `fecha_fin` | `YYYY-MM-DD`; final derivable de plazo en meses |
| `requiere_poliza` | Booleano |
| `tipo_poliza` | Lista separada por `;`; vacío cuando no requiere |
| `estado_poliza` | `vigente`, `pendiente`, `vencida` o `no_aplica`; nuevo con póliza: `pendiente` |
| `comercial` | Nombre resuelto desde catálogo |
| `ruta_sharepoint` | Ruta relativa en `out/sharepoint/` |
| `fecha_registro` | `YYYY-MM-DD` |
| `fuente` | `buzon`, `manual` o `migracion`; no implica implementar otros canales fuera del buzón |

- **Comercial**: email/nombre/región. Catálogo entregado: Laura Gómez Restrepo (`lgomez`), Carlos Ruiz Medina (`cruiz`), Andrés Molina Pardo (`amolina`), todos en `periferia-ficticia.com`; `jperez` no está registrado.
- **Validación y confirmación**: clasificación, identificador existente, diferencias y campos en revisión; confirmación humana asociada a los datos pendientes, sin otorgar autoridad independiente al modelo.
- **Estado operativo**: copia maestra, adjuntos archivados, procesados, historial de cambios y log de ejecución con correlación segura.
- **Sesión y alerta**: conversación, llamadas y estado pendiente; reporte por fecha de referencia con las tres categorías exigidas.

### Inventario de operaciones y capacidades críticas

Es crítica la lógica que determina qué se registra, modifica, rechaza, confirma o reporta; es significativa cada ejecución de herramienta, confirmación y cambio de estado por sus efectos sobre integridad, costo o trazabilidad (C workflow 1). El inventario fija el alcance de evidencia que Plan debe mapear, sin diseñar todavía soluciones.

| Operación / capacidad | Invariantes y evidencia de aceptación |
| --- | --- |
| Lectura y rechazo | Solo pendientes, metadatos fieles, cotización rechazada; HU-1, RN4, FR-002 |
| Extracción y normalización | Sin invención, confianza y esquema válidos; HU-2, FR-003 |
| Clasificación / revisión | RN1–RN5, similitud ≥0.9, umbral <0.8, desconocido no bloqueante; HU-3 |
| Registro / actualización / archivo | Una fila por contrato, fixtures inmutables, confirmación obligatoria cuando aplica, historial y procesados coherentes; HU-4, RN6 |
| Alertas | Tres categorías, corte y `hoy` controlados; HU-5 |
| Orquestación / confirmación / límites | Valores respaldados por herramientas, siguiente mensaje humano, sesión recuperable, consumo acotado; CA1–CA5 |
| Diagnóstico / verificación / entrega | RN7, trazas seguras, demo repetible, pruebas y aplicación pública integrada; FR-013, FR-017, NFR-007–009 |

### Fixture outcomes y aceptación trazable (§7.4)

Maestro inicial: ocho filas. No se modifican ni sustituyen los fixtures para conseguir resultados.

| Mensaje | Evidencia real | Resultado obligatorio |
| --- | --- | --- |
| `msg-001` | `CT-2026-015`, Industrias Delta, `265000000 COP`, `2026-08-01` a `2027-07-31`, cumplimiento | `nuevo`, registrado, póliza `pendiente`; comercial Laura |
| `msg-002` | `CT-2026-016`, Corporación Andina, `120000 USD`, `2026-08-15` a `2027-08-14`, sin póliza | `nuevo`, registrado, `no_aplica`; comercial Carlos |
| `msg-003` | Otrosí `CT-2026-011`, Minera Los Andes: `520000 PEN`, fin `2027-11-01`; demás cláusulas sin modificación, garantías por ampliar | `actualizacion`, modificar misma fila y dejar historial; conservar datos no modificados y fecha original de alta. Validar cambios y confirmar conflictos aplicables, sin afirmar que las garantías ya fueron ampliadas (A2, Q3, Q5) |
| `msg-004` | `CT-2026-012`, Clínica San Rafael: `210000000 COP`, `2026-05-15` a `2026-11-14`; objeto redactado distinto del resumen maestro | `duplicado`, sin escritura según PRD; RN1 precede a RN2 para este documento ordinario (Q3) |
| `msg-005` | Cotización `COT-2026-088`, no contrato | `rechazado` con motivo; sin alta contractual |
| `msg-006` | `CM-2026-03`, Distribuidora Caribe; valor indeterminado; doce meses desde firma sin día; garantía condicionada a órdenes >`100000000 COP`; remitente desconocido | `nuevo`, revisión obligatoria de valor y fin, sin registrar hasta confirmación humana. Inicio `null/0` con evidencia parcial agosto de 2026; pedir fecha exacta para registrar. Póliza condicionada: aplicabilidad pendiente de revisión y confirmación humana antes del registro, sin asignar automáticamente `pendiente` o `no_aplica` (Q2). Ejemplo confirma `0` y `2027-08-31` y espera registro, pero omite inicio y representación de póliza: discrepancia explícita Q1–Q2, no datos inventados |

Tras altas confirmadas de los tres nuevos y actualización, el maestro tiene once filas, manteniendo una sola por contrato, sin filas por duplicado/cotización. La primera pasada deja `msg-006` sin registrar. El ejemplo conversacional usa `2026-09-03` explícitamente, no la fecha del equipo ni la fecha de redacción de esta especificación.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Los seis mensajes quedan clasificados conforme a la tabla de resultados, con cero filas duplicadas y once contratos tras confirmar los tres nuevos y actualizar el existente (O1–O2, §7.4).
- **SC-002**: El 100% de los campos por debajo de 0.8 se presenta para revisión y ninguna operación pendiente se registra sin confirmación; el caso dudoso se completa después de la confirmación humana válida (O3, CA3).
- **SC-003**: La actualización conserva un único contrato y evidencia de los cambios; el duplicado y la cotización no crean registros (§§5, 7.3–7.4).
- **SC-004**: El reporte presenta las tres categorías exigidas con fecha de referencia explícita y resultados verificables, incluyendo la frontera de 60 días (O4, HU-5).
- **SC-005**: La analista puede ejecutar la solicitud y continuación de §11 desde el enlace público viendo todas las llamadas, resultados, pregunta pendiente y errores claros, sin perder la sesión; el registro completo requiere además precisar y confirmar los datos pendientes de Q1–Q2, discrepancia documentada con el ejemplo abreviado (CA1–CA5, §9.3).
- **SC-006**: La verificación directa de los seis casos funciona sin modelo ni clave, deja el caso dudoso pendiente antes de confirmar y repite los mismos resultados salvo timestamps (§6.6, §8).
- **SC-007**: Un mensaje inválido no impide procesar el siguiente; un proveedor fallido o un límite alcanzado deja una explicación clara y evita consumo por encima del presupuesto configurado (HU-6, §8).
- **SC-008**: La aplicación completa inicia mediante un comando en menos de dos minutos con la configuración documentada y permanece accesible durante la defensa; todos los entregables obligatorios permiten reproducir y explicar la solución (§§8–9).

## Assumptions

- PRD v2.0 es la fuente de negocio; Constitución v2.0.0 gobierna ingeniería y gates. No se añaden servicios, tecnologías, reglas de negocio ni métricas de calidad ajenas a esas fuentes.
- Los adjuntos TXT entregados son los insumos P0 reales. Se conserva su extensión al archivar; no hay PDF binarios que inventar. Se reconoce el supuesto de PDF con texto en producción, sin ampliar alcance a OCR (§§3.2, 7.1, 10).
- No se usan integraciones reales; los datos entregados son ficticios. La eficacia del canal depende del cumplimiento comercial de la regla de gobierno (§10).
- El proveedor/modelo, framework y hosting no están elegidos. Para la comprobación real y despliegue se necesitarán configuración y credenciales externas seguras, sin impedir la demo sin modelo.
- Las prioridades P0 no autorizan omitir historias o entregar solamente herramientas. La feature comprende frontend, backend, agente, documentación y despliegue juntos.
- La duración de la sesión no está fijada en el documento (§0), y no existe la rúbrica numérica referida allí. No se inventan duración, pesos ni un reparto del 70/100; el bonus se mantiene opcional.

### Ambigüedades para la fase Clarify

Los tres grupos se revisaron contra PRD/fixtures y las cinco respuestas aceptadas. No quedan preguntas de negocio abiertas en esta sesión; las elecciones de método y sus evidencias corresponden a Plan (C workflow 2–3). Las notas del checklist que describen ambigüedades pendientes son el diagnóstico original de Specify; esta sección y Clarifications registran su resolución actual.

- **A1 — Datos incompletos de `msg-006`**: Resuelto por Q1–Q2: no inferir inicio, conservar evidencia parcial y pedir precisión humana; conservar condición de póliza y solicitar confirmación de su aplicabilidad/representación antes de registrar, sin elegir automáticamente obligación inmediata o `no_aplica`. El ejemplo §11 no aporta todos esos datos: discrepancia documentada, sin alterar silenciosamente la expectativa de registro del PRD. Remitente desconocido no bloqueante y confianza <0.8 requieren revisión por definición expresa del PRD. Moneda y otros datos deben conservar evidencia y validación; no se completa un dato contractual sin respaldo. Fuentes: HU-2–HU-4, §§7.2, 7.4, 11 y contrato real.
- **A2 — Clasificación y otrosí parcial**: Precedencia resuelta por Q3: otrosí explícito → actualización; documentos ordinarios → RN1 antes de RN2. El fixture `msg-003` indica que las demás cláusulas no cambian: conservar del maestro los datos no modificados, sin presentarlos como extraídos del otrosí ni convertir ausencia textual en borrado. Sus modificaciones siguen sujetas a validación, revisión de conflictos y confirmación aplicable. No se presume que la ampliación de garantías ya esté emitida ni se cambia automáticamente el estado de póliza por clasificar el otrosí. Fuentes: HU-2–HU-4, RN1/RN2, §7.4 y ambos adjuntos/filas reales. Algoritmo de similitud y cálculo de confianza quedan para Plan como métodos verificables, respetando ≥0.9 y <0.8 y los resultados obligatorios, sin añadir reglas de clasificación.
- **A3 — Escrituras operativas y semántica temporal**: Resuelto por Q4–Q5. Duplicados y rechazados definitivos se marcan procesados y dejan log, sin efectos contractuales; pendientes de confirmación y errores recuperables quedan abiertos. HU-4/RN6 fijan copia del maestro, archivado, historial y marcado en registros exitosos; RN7 exige log en toda ejecución. La limpieza de `out/` corresponde a la demo, no a cada turno del chat. Altas con fecha de ejecución controlada en demo/pruebas, actualizaciones conservan fecha original y se fechan en historial. Alertas de vencimiento: entre hoy y 60 días inclusive; sección desde corte según fecha de alta >= `2026-05-30`. Fuentes: HU-1, HU-4–HU-5, RN1/RN7, §§7.2, 8. Recuperación ante fallos parciales y protección de reintentos de registro se concretarán en Plan sin permitir duplicados ni vulnerar invariantes (C III).
