# Implementation Plan: Registro de Contratos Vigentes

**Branch**: `main` (rama Git real; setup-plan informa el identificador lógico `001-registro-contratos-vigentes` desde feature.json) | **Date**: 2026-10-22 | **Spec**: [spec.md](spec.md)

**Input**: PRD v2.0, Constitución v2.0.0, spec completa con Q1–Q5 y todos los fixtures. Una feature integral; este comando termina tras diseño, sin tasks.md ni código de aplicación.

## Summary

Un único servicio Node sirve chat TypeScript y API, orquesta un proveedor LLM reemplazable e invoca cinco herramientas tipadas independientes del HTTP/modelo. El dominio determinista extrae, valida, clasifica y aplica reglas sobre CSV/JSON/JSONL y adjuntos locales. Confirmación humana comprobada por aplicación; resultados contractuales visibles provienen de herramientas. Un escritor y journal recuperable preservan invariantes sin base de datos.

La implementación futura avanza por cortes verificables: dominio/herramientas/demo sin clave → persistencia y errores → adaptador/ciclo/confirmación → frontend → documentación, entrega y despliegue real. Es orden de diseño, no lista de tareas generada. No se acepta sustituir la aplicación completa por demo o herramientas.

## Technical Context

**Language/Version**: TypeScript strict sin any; Node.js 24 LTS, ESM; npm y package-lock.json, engines ≥24 para el entorno elegido (cumple Constitución ≥20). Versiones exactas de paquetes se fijan al instalar y quedan bloqueadas, sin usar etiquetas latest en despliegue.

**Primary Dependencies**: Express 5, Zod 4, csv-parse/csv-stringify. Desarrollo: TypeScript, tsx, Vite vanilla-ts, Vitest, Playwright y tipos de Node/Express. Sin React, BD, ORM ni framework de agentes. APIs nativas fs/crypto/fetch; proveedor OpenAI Chat Completions, snapshot configurable gpt-5.4-mini-2026-03-17. Justificación, alternativas y fuentes en [research.md](research.md).

**Storage**: fixtures inmutables; out/sharepoint/maestro-contratos.csv, Contratos/, historial.jsonl; out/procesados.json, log.jsonl, alertas.md; journal técnico y presupuesto durable. Sesiones en memoria detrás de interfaz, pérdida de sesión tras reinicio explicada, sin perder contratos/presupuesto. Modelo de archivos y recuperación en [data-model.md](data-model.md).

**Testing**: Vitest para dominio, contrato y filesystem con reloj/modelo controlados; Playwright para chat; demo.ts sin clave/modelo con fallos de verificación no cero; smoke desplegado con proveedor real separado. No se generan suites en Plan.

**Target Platform**: Windows/Linux local con Node24; navegador moderno; Render Linux, una instancia web con disco persistente montado en out. Mismo origen frontend/API, sin CORS externo.

**Project Type**: Aplicación web conversacional independiente, repositorio único, contrato tools compartido con demo. No es bot de una plataforma existente.

**Performance Goals**: Inicio conjunto en <2 minutos conforme PRD §8, medido desde comando de arranque tras instalación/configuración; registrar también duración total del setup en máquina limpia y no afirmar cumplimiento si su interpretación completa excede el umbral. Sin objetivos arbitrarios de throughput/latencia de negocio. Timeouts técnicos acotados abajo.

**Constraints**: Sin base de datos, integraciones Exchange/SharePoint reales, OCR, autenticación/roles/multiusuario obligatorio ni reconstrucción histórica ejecutada. Front/backend TypeScript, Zod en fronteras. Las herramientas nunca ejecutan shell. La app pública tiene presupuesto compartido contra evasión mediante sesiones nuevas.

**Scale/Scope**: Seis mensajes, ocho contratos semilla, hasta once tras altas completas; una analista y gerencia consumiendo alertas. Serializar mutaciones, sin autoscaling. P1 PDF, streaming y módulo bonus no bloquean P0 y no cuentan como cubiertos por diseñarlos.

## Constitution Check

**Antes de investigación: PASS documental, 2026-10-22.** Constitución, PRD, spec y fixtures revisados antes de cerrar investigación/diseño; sin excepción ni enmienda. **Después de diseño: PASS documental, 2026-10-22**, con evidencia planificada en la tabla siguiente. PASS no significa pruebas ejecutadas, recursos externos disponibles ni release aprobado.

| Principio/gate | Arquitectura y artefactos | Evidencia futura / evaluación posterior |
| --- | --- | --- |
| I / restricciones | Separar dominio, aplicación, HTTP, LLM, repositorios y web. Node24/TS/Zod y cuatro rutas obligatorias sin cambios. | Typecheck, imports de tools sin servidor/LLM, revisión estructural; PASS diseño. |
| II | Extracción, clasificación, validación y ejecución directas; contexto seguro con reloj/source hash. | Demo sin clave, pruebas de dominio y modelo controlado; PASS diseño. |
| III | Validación doble, mutex, receipt, journal/rollback/recovery y revisión del maestro al commit. | Fallo en cada publicación, reinicio, reintentos y conflictos; invariantes de data-model.md; PASS diseño, sin prometer atomicidad externa. |
| IV | Credenciales backend, autorización ligada a siguiente mensaje humano/hash/sesión; confinamiento rutas y escape de salida. | Bypass confirmado, sesión ajena, cambios posteriores, traversal, XSS y redacción; PASS diseño. |
| V | Vitest, Playwright, demo nonzero y check real desplegado con presupuesto. | Gates de release completos, independientes de pruebas controladas; PASS diseño. |
| VI | RN7 más correlación/callId/transaction y referencias seguras sin texto sensible íntegro. | Cruzar log/historial/receipt/chat y comprobar secretos ausentes; PASS diseño. |
| VII | Lockfile, comandos/entorno, topes/timeouts, Render con disco durable, backup/recovery. | Instalación limpia, build, URL y health/chat/agent juntos; PASS diseño. |
| VIII | SOLUCION once secciones, gobierno de una página, costos/supuestos, README/.env.example. | Revisión de contenido/ejecución, no solo archivos presentes; PASS diseño. |
| Workflow / Governance | Trazabilidad completa, Q1–Q5 conservadas; revisión de cambios y aprobación del dueño registrada. | Registro versionado o PR con alcance/decisión antes de merge/release significativo; Plan no concede esa aprobación. PASS diseño. |

No gates omitidos. Pruebas ejecutables y live check todavía no aplican a estos documentos de diseño, pero son obligatorios para implementación/release. El Sync Impact Report temporal de Constitución se detecta como material a retirar antes de un commit de esa enmienda según su Governance; este Plan no edita ni regenera la Constitución.

## Project Structure

### Documentation (this feature)

```text
specs/001-registro-contratos-vigentes/
├── spec.md
├── checklists/requirements.md
├── plan.md
├── research.md
├── data-model.md
├── contracts/interfaces.md
└── quickstart.md
```

### Source Code (repository root)

Layout propuesto, no archivos de aplicación creados por este comando:

```text
agent/prompt.md
src/
  server.ts
  config.ts
  domain/              # schemas, extracción, clasificación, fechas, alertas
  application/         # operaciones, revisión, confirmación y puertos
  infrastructure/      # mailbox/file repositories, journal, audit, budget
  tools/contratos.ts    # cinco exports obligatorios, delegan ejecución
  llm/adapter.ts
  llm/openai.ts
  agent/               # ciclo, sesiones, presenter de hechos verificados
  knowledge/registro-contratos.md
web/                   # index.html, main.ts, styles.css
fixtures/reto-02/       # solo lectura
out/                   # generado y excluido de Git/entrega
  sharepoint/
  .transactions/
tests/                 # unit, contract, integration, browser, live
  support/             # reloj, fake adapter, respuestas humanas de prueba
  evidence/            # resultados seguros de release, excluye secretos/out
scripts/               # arranque dev y verificación, no tools shell
demo.ts
README.md
SOLUCION.md
.env.example
package.json
package-lock.json
tsconfig.json
vite.config.ts
```

**Structure Decision**: Monolito modular con frontend independiente por HTTP. El entrypoint obligatorio permanece en src/tools/contratos.ts; módulos propios pequeños por responsabilidad, no framework de capas genérico. Prompt es comportamiento; knowledge es proceso; domain/tools ejecutan reglas sin modificar servidor. Bundle web a dist/web y backend a dist/src; prompt/knowledge/fixtures se leen desde raíz de revisión desplegada. Mantener paths relativos y fijar raíz en bootstrap, no en requests.

## Diseño de operaciones y conversación

Contratos exactos en [contracts/interfaces.md](contracts/interfaces.md), campos y transiciones en [data-model.md](data-model.md).

- leer_buzon lista pendientes con los campos HU-1, inspecciona adjuntos; msg-005 se reporta rechazado antes de cerrar Q4, sin desaparecer del resultado de esa consulta. Las siguientes consultas lo excluyen. Logs siempre.
- extraer usa cláusulas y evidencia para contraparte/identificador/objeto/moneda/fechas/póliza. Escala técnica de confianza documentada en research, umbral <0.8 intacto. No hardcodear clasificaciones por IDs.
- validar aplica RN4, identidad, otrosí Q3, RN1 en ordinarios, RN2/RN3; semejanza Levenshtein normalizada ≥0.9 con NIT igual. Heredar datos no cambiados de otrosí desde maestro con origen explícito. Mostrar diferencias y revisión de conflictos.
- registrar revalida y comprueba confirmación en operación, bajo lock de estado. No confiar en la lista de revisión o confianza enviada por el LLM. Datos humanos y decisiones están ligados a pendingId/hash/candidato; cambio nuevo no queda autorizado por un sí antiguo.
- alertas usa hoy explícito y Q5: 0..60 días inclusivos; requiere_poliza && estado_poliza!=vigente; fecha_registro>=2026-05-30. No altera fecha de alta al actualizar.

El frontend presenta thinking, historial y cada llamada con nombre, argumentos sanitizados y resumen. El loop real interpreta la petición y solicita tools; los hechos contractuales de respuesta se construyen de resultados validados, evitando valores inventados en texto libre. Falta de modelo/timeout/límites produce respuesta local clara, conserva sesión y hechos ya verificados. Ante revisión, termina turno con pregunta y formulario; siguiente mensaje humano puede confirmar/corregir, con información incompleta mantiene pendiente.

Q1–Q2: msg-006 conserva inicio null/0 con evidencia agosto2026 y aplicabilidad de póliza pendiente. Valor0/fin2027-08-31 del ejemplo no completan todo. Pedir inicio preciso y decisión de póliza, y moneda si no está respaldada. Catálogo desconocido se representa vacío y advertencia, sin inventar nombre ni bloquear por ese motivo. Demo usa respuestas humanas declaradas, jamás fechas simuladas presentadas como extraídas.

Q3: otrosí explícito antes de RN1; ordinarios RN1 antes de RN2. Q4: duplicados/rechazos definitivos cierran procesados con log, sin archivado/historial/maestro. Errores recuperables y revisión abiertos. Q5: alta usa reloj de ejecución, actualizado conserva fecha original, historial sí registra instante. Reloj de demo 2026-09-03; no sustituye fechas contractuales.

## Límites operativos y seguridad

Valores técnicos iniciales, configurables y validados al arrancar; son mecanismos para FR-010/NFR-006, no nuevos objetivos de negocio.

| Variable | Valor inicial / enforcement |
| --- | --- |
| PORT | 3000 local; proveedor lo suministra en deploy, host 0.0.0.0. |
| OPENAI_API_KEY | Solo backend, requerido para chat real, no para demo/tests de tools. Nunca echo ni logs. |
| LLM_MODEL | gpt-5.4-mini-2026-03-17, snapshot configurable con contrato de tools compatible. |
| AGENT_MAX_ITERATIONS | 25 rondas modelo→tools por turno; al llegar, resumen local de realizado/pendiente sin llamada adicional. |
| LLM_MAX_COMPLETION_TOKENS | 2048 por petición; reducir según reserva restante. reasoning_effort=none, un completion, sin retries automáticos. |
| SESSION_TOKEN_BUDGET | 1000000 tokens totales entrada+salida acumulados por sesión; rechazo antes de reservar una petición que no cabe. |
| GLOBAL_TOKEN_BUDGET | 2000000 acumulados entre todas las sesiones; ledger durable en out/usage.json, sin reset por reinicio/sesión nueva. Reset/renovación solo operación local del dueño documentada; no endpoint/chat. |
| LLM_TIMEOUT_MS | 30000 con AbortController; reserva no recuperada si consumo final desconocido. |
| AGENT_TURN_TIMEOUT_MS | 120000 total; no iniciar llamada sin tiempo restante, abortar al expirar; conservar trabajo previo y explicar pendiente. Reanudar explícitamente, no bucle automático. |
| APP_TIMEZONE | America/Bogota para fecha de ejecución; aritmética fecha-sola UTC; tests Clock fijo. |

Presupuesto: serializar/reservar antes de fetch bajo lock. Medir usage real (prompt y completion incluidos razonamiento si el proveedor los reporta); acumular el total facturable, no solo texto visible. Para preflight sin dependencia tokenizer, usar límite superior conservador: bytes UTF-8 del JSON completo de messages+tools, más 8192 tokens de margen de framing, más max_completion_tokens. Limitar a 60 mensajes normalizados y 5 tools por petición; no enviar si el sobre excede reserva restante. El margen se valida contra usage del snapshot en pruebas de integración y live check; nunca describir bytes como conteo exacto. Si usage falta/timeout, retener toda reserva; si usage excede envelope, deshabilitar nuevas llamadas y registrar fallo del control, no dar por aprobado el release. Esto sobre-reserva y puede detener antes; no se usa subestimación por caracteres/4. No truncar silenciosamente evidencia/pendientes: si no cabe contexto, explicar límite y conservar historial local.

Una cuota global es necesaria porque el enlace público sin login permite crear sesiones. Conservar ledger al backup/restart y no ejecutar demo/reset sobre instancia pública. Protección de acceso opcional no sustituye topes. Fijar límites del proyecto proveedor también cuando la cuenta los permita; el diseño no depende de que esos controles externos estén disponibles.

Seguridad: Zod en solicitudes, tools, archivos de fixtures/estado y respuesta provider; allowlist de nombres; no shell. Directory y runtime solo bootstrap. Realpath/confinamiento de entradas/adjuntos, root no servido por HTTP, texto escapado en DOM y redacción central de errores. Secretos no van a prompts, UI, logs ni respuestas; logs guardan referencias y campos, no documentos completos ni valores personales reales. Sin herramientas de edición de archivos libres del modelo.

## Consistencia y errores

Repositorio único con mutex de lecturas/escrituras, lock de un proceso, staged snapshots/journal/commit marker/receipts. Recovery antes de escuchar HTTP y rollback de publicación incompleta; no prometer atomicidad filesystem entre archivos para lectores externos. Reintento tras respuesta perdida devuelve receipt sin segundo cambio/historial; cada intento de tool sí deja log. Si no se recupera consistencia, bloquear operaciones de estado y mostrar error legible, no reseed destructivo. Modelo/API es externo sin efecto contractual directo; su fallo no revierte registros ya confirmados ni se reproduce como si fuera determinista. Procedimiento completo y fallos por fase en data-model.md.

Texto vacío, fecha inválida y moneda desconocida son ok:false/error, sin throw hacia consumidor; clasificaciones rechazado/duplicado son resultados de dominio. CA5 conserva sesión. Fallo por un mensaje no aborta los restantes; si el proveedor cae, el turno informa lo completado y conserva lo pendiente para continuar cuando vuelva. Logs y historial tienen correlación/resultado seguros.

## Verificación y trazabilidad

Evidencias con revisión fuente y datos ficticios; la tabla define pruebas necesarias, no suites creadas en Plan.

| Requisitos / PRD | Componente | Evidencia de aceptación |
| --- | --- | --- |
| HU-1, FR-002, RN4, Q4 | MailboxRepository, leer_buzon | Seis metadatos exactos, cotización no contrato, cierre y siguiente lista excluye cerrado. |
| HU-2, FR-003, RN5, FR-019–020, Q1–Q2 | extractor/parser/schemas | Datos y origen de seis textos; ausencias null/0; valor265M COP/120kUSD/520kPEN correctos; fecha parcial no inventada; póliza condicionada revisable. |
| HU-3, FR-004–005, RN1–RN5, Q3 | classifier/validator | msg-003 actualización y msg-004 duplicado pese a objeto distinto; semejanza 0.9 inclusive; mismo cliente distinto objeto no fusiona; unknown comercial no bloquea; múltiples candidatos revisables. |
| HU-4, FR-006, FR-012, FR-019–021, RN6 | registrar/repository/confirmation | Copia inicial intacta, archivado hash igual/ruta exacta, cambios/historial/procesados; inicio/póliza requieren humano; confirmado del modelo rechazado; reintento y fallos no duplican. |
| HU-5, FR-007/022, Q5 | alertas/Clock | Fecha hoy fija; límite0/60 incluido, -1/61 excluido; fecha de alta conservada. Oracle detallado en data-model. |
| HU-6, FR-008/010, CA1/CA5 | tools/loop/adapter | Texto vacío/fecha inválida/moneda desconocida, Zod inválido, provider timeout/error; siguiente mensaje procesable/sesión viva, límite sin llamada adicional. |
| FR-001/009/011/013–016, CA2–CA4 | HTTP/loop/presenter/web | POST chat, GET sesión/health; thinking y calls; pregunta resaltada/confirmación siguiente turno; inyección documental/HTML y valores no respaldados bloqueados o no presentados. |
| FR-017, SC-001–007, §6.6 | demo | Sin clave ni imports ejecutables del proveedor, seis mensajes ordenados; diez filas tras dos altas limpias y actualización; once tras completar/confirmar tercero; 0 duplicados; pendientes no registrados en primera pasada; segunda pasada sin cambiar fixture. Comparación de outputs excepto timestamps. |
| NFR-001/003/005/007 | build/test/config | TypeScript strict/no-any, Node24, npm ci con lockfile, typecheck y build, suite controlada y startup <2min; no BD. |
| NFR-002/004/006, §8 | repos/config/audit/budget | Fixtures hash sin cambios, rutas confinadas y ningún shell; secretos ausentes en repo/historial/API/front/log; cuotas persistentes incluso sesión nueva/reinicio; sin doble gasto concurrente. |
| FR-018, NFR-009, §§7.5/9.1/9.2/9.5 | documentación/review | Once secciones SOLUCION, propuesta gobierno, README/env, commits y exclusiones; revisión/decisión del dueño registrada. |
| NFR-008, SC-005/008, §9.3 | deployment | URL pública con front/backend/modelo real, revisión/resultados/costo, restart persistente y procedimiento de recuperación. |

## Entregables y revisión de documentación

SOLUCION.md tendrá exactamente las once áreas PRD: (1) problema/afectado, (2) diagrama y separación, (3) ciclo/límites/confirmación, (4) elección/modelo/costo por caso, (5) extracción/confianza, (6) gobierno de una página, (7) al menos tres trade-offs con alternativas, (8) supuestos incluidas discrepancias Q1–Q2, (9) cobertura de seis HU y brechas producción, (10) asistentes utilizados y propuestas descartadas/razón, (11) riesgos/mitigación. Incluir las decisiones de research y costo medido/estimado, no afirmar producción ni cobertura sin evidencia.

La página de gobierno cubre: canal y administrador (buzón fixture, analista como propuesta de responsable, no hecho externo confirmado), obligación comercial/documentos/plazo/asunto propuestos, acuse/tiempo propuesto, excepciones/escalamiento, campaña única junio–agosto solo diseñada, indicador mensual. Marcar como propuesta los plazos/roles concretos que el PRD pide diseñar: no ejecutarlos como políticas nuevas del agente ni enviar correos reales.

README: instalación/runtime, comando único dev, variables, API, demo/tests/build, URL/acceso si aplica, deployment/verification/recovery. .env.example enumera variables sin valores secretos; defaults seguros no sensibles documentados en README. Source repo conserva historial significativo sin mínimo artificial de commits; excluir .env, out, node_modules y outputs build; revisar también historial por secretos. Lockfile sí versionado. La alternativa ZIP del PRD no elimina la modalidad repo solicitada. Rúbrica de 70/100 no está disponible: no inventar pesos; PDF P1/bonus no son obligatorios.

## Deployment y live check de release

Render web service único con disco en /opt/render/project/src/out. Build npm ci + npm run build, start npm start, puerto PORT y bind0.0.0.0, health /api/health; variables solo backend, pin Node24. Nunca reseed/copy sobre maestro existente. Verificar escritura/lectura/restart sobre disco y revisión desplegada; backup de out completo antes de deploy; downtime breve aceptado como limitación operativa del disco, no prometer rolling deploy. URL efectiva se registra cuando exista, no se inventa en este plan.

Recovery: parar escrituras/servicio, conservar evidencia segura, restaurar snapshot coherente de out y revisión compatible, arrancar recovery journal, ejecutar health y comprobación contractual/agent. Si no hay cuenta/disco, túnel público estable con mismo proceso durable es alternativa PRD, no omitir URL ni live check. Defensa solo local con penalización no pasa gate constitucional.

Live check desde URL de release, sobre estado de evaluación controlado y sin destruir datos ajenos: health+chat, solicitud de §11, seis clasificaciones, calls visibles/log, pendientes msg-006 no escritos; aportar explícitamente inicio preciso y decisión póliza/moneda como datos humanos de evaluación, después confirmar; comprobar once filas/historial/archivo/reporte. Si msg-003 tiene revisión, confirmarla explícitamente también. No simular que la frase abreviada completa datos faltantes.

Presupuesto live total, incluidas repeticiones: máximo 1000000 tokens entrada+salida reservados/consumidos, máximo 40 llamadas y máximo USD5 estimados; como tarifa más alta verificada es USD4.50/M, el techo conservador de tokens implica ≤USD4.50 sin descuentos (revalidar tarifas al release). Máximo dos ejecuciones dentro del mismo presupuesto, no dos presupuestos. Al agotar, fallo de check y análisis, sin retry abierto ni gate dispensado. Hosting se registra separado; este plan no compra recursos.

Pass: credenciales/configuración/conectividad reales; loop usa herramientas; ninguna escritura dudosa sin humano; datos y alertas coinciden con oracles Q1–Q5; sesión y UI/calls/log coherentes; consumo dentro de límites. Fail: cualquier criterio ausente, dato inventado, uso falso de confirmado, error proveedor sin completar interacción o gasto excedido. Guardar SHA fuente, URL, proveedor/modelo, configuración no secreta, usage/costo, resultados y aprobación release. Health sin llamar modelo no prueba conectividad.

Costo en SOLUCION: entrada total de todas las rondas x tarifa + salida total x tarifa, incluyendo reasoning si aplica; nunca solo prompt inicial. Ejemplo orientativo 20000 entrada+4000 salida = USD0.033 por interacción de lote a tarifas documentadas; dividir por número de contratos realmente procesados y declarar supuestos, sin prometer ese consumo. Ajustar con usage observado. Pruebas controladas/demo cuestan cero en LLM.

## Riesgos y límites de preparación

- Q1–Q2 documentan conflicto del ejemplo PRD con datos reales: tests requieren respuestas humanas declaradas, no modificar fixtures para lograr once filas.
- Disponibilidad/cuota/clave del modelo y cuenta de hosting son dependencias de release aún no comprobadas. No bloquean generar Tasks; sí aprobar deployment sin evidencia.
- Una instancia y out compartido son adecuados al alcance, sin garantía multiusuario; no aumentar replicas. Sesiones en memoria se pierden al restart y se informa; maestro/budget no.
- La heurística de similitud/confianza necesita pruebas con límites y fixtures; no es calidad calibrada para contratos de producción. Ampliar producción requeriría alcance/revisión propios.
- El presupuesto conservador puede frenar temprano; validar antes de la defensa con límites acotados, no subirlos silenciosamente. Cambiar modelo exige comprobar contrato/token accounting/precios.
- Archivar la versión activa no es gestión documental histórica completa. Reportar ese trade-off y proteger fallos parciales mediante journal/backups.

## Complexity Tracking

Sin violaciones constitucionales ni excepciones solicitadas. Componentes adicionales justificados: journal por integridad y recuperación; confirmación server-side por CA3/seguridad; ledger global por enlace público sin gasto ilimitado; CSV parser por formato; browser test por UX obligatoria. Sin base de datos, cola externa, arquitectura distribuida o dependencia de framework de agentes.

Estado de salida de Plan: investigación y diseño completos; contracts/data-model/quickstart enlazados; gates posteriores pasan documentalmente. Listo para generar Tasks con trazabilidad, implementación determinista primero y entrega completa. No se ejecutó implementación, instalación, tests de aplicación, llamadas LLM pagadas ni despliegue en esta fase.
