# Registro de Contratos Vigentes

Aplicación conversacional TypeScript con cinco herramientas deterministas, confirmación humana y archivos locales. Estado: implementación local en verificación; OpenAI real y URL pública pendientes por decisión del responsable. No se ha contratado hosting ni consumido la API en estas pruebas.

Requiere Node.js 24 y npm. Instalar con `npm ci`; copiar `.env.example` a `.env` y configurar `OPENAI_API_KEY` solo en el backend. Arranque local: `npm run dev` (puerto 3000). Sin clave, el servidor funciona pero el chat informa proveedor no configurado; la demo y las pruebas no necesitan clave.

```sh
npm run demo
npm run typecheck
npm test
npx playwright install chromium
npm run test:e2e
npm run build
npm start
```

En PowerShell usar `npm.cmd`/`npx.cmd` si la política bloquea scripts `.ps1`. En redes corporativas que requieren el almacén del sistema, Node24 admite `NODE_OPTIONS=--use-system-ca`; no desactivar TLS.

La demo **reinicia exclusivamente `out/`** con un reloj 2026-09-03. No ejecutarla sobre un servicio activo ni sobre datos que deban conservarse. Usa los seis fixtures intactos y respuestas humanas de ejemplo explícitas para completar las revisiones; esas respuestas no son datos extraídos ni políticas por defecto.

## Configuración

Los valores vacíos del ejemplo usan defaults validados en `src/config.ts`:

| Variable | Default / significado |
| --- | --- |
| OPENAI_API_KEY | Sin default; únicamente servidor |
| PORT | 3000 |
| LLM_MODEL | gpt-5.4-mini-2026-03-17; snapshot del Plan, pendiente de prueba real |
| AGENT_MAX_ITERATIONS | 25 rondas por turno |
| LLM_MAX_COMPLETION_TOKENS | 2048 |
| SESSION_TOKEN_BUDGET | 1000000 |
| GLOBAL_TOKEN_BUDGET | 2000000, durable y compartido |
| LLM_TIMEOUT_MS | 30000 |
| AGENT_TURN_TIMEOUT_MS | 120000 |
| APP_TIMEZONE | America/Bogota |
| LIVE_CHECK_MODE | Solo operador: `1` limita evaluación a 40 llamadas y 1000000 tokens globales durables; vacío en uso normal |

Cuotas reservadas antes de fetch; consumo desconocido conserva reserva. No hay reintentos automáticos. Revisar `out/usage.json` con el servicio detenido para operaciones de presupuesto; nunca eliminarlo para eludir límites de evaluación.

Antes de una evaluación real autorizada, iniciar servidor y operador con `LIVE_CHECK_MODE=1`; el verificador exige además `LIVE_TARIFF_REVIEWED=1` después de revisar la tarifa máxima del Plan en la documentación oficial. Esta variable registra una revisión humana, no demuestra por sí misma que una tarifa sea correcta. Hoy no está autorizado ejecutar ese check.

## API y persistencia

`POST /api/chat` recibe `{message,sessionId?,humanAction?}`. La respuesta incluye reply, toolCalls, status y pending. `GET /api/sessions/:id` reconstruye historial; `GET /api/health` comprueba configuración, **no conectividad al modelo**. El servidor fija el directorio y las políticas; HTTP no permite seleccionar rutas ni activar el proveedor de pruebas.

`fixtures/` es solo lectura. Todo estado generado vive en `out/`: maestro/archivos/historial en `sharepoint/`, procesados, log, journal y usage. Una instancia y un escritor; no aumentar réplicas. Las sesiones viven en memoria y se pierden al reiniciar; datos contractuales y cuota persisten. El maestro se copia del fixture únicamente si no existe.

`msg-006` conserva agosto de 2026 como evidencia parcial: exige día exacto, fin/valor y decisión de póliza/moneda. La frase abreviada del PRD §11 no basta. Las correcciones se presentan y confirman por el humano; el modelo no puede autorizarse mediante `confirmado:true`.

## Preparación del despliegue y recuperación

Render: web service Node24, **una instancia**, build `npm ci && npm run build`, start `npm start`, health `/api/health`; disco persistente montado en `/opt/render/project/src/out`. Configurar variables en el servidor. Esta configuración no crea ni contrata recursos. URL pública: pendiente; no existe enlace verificado.

Antes de desplegar, detener escrituras y respaldar **todo `out/` coherentemente**, junto con SHA de código y configuración no secreta. Restaurar snapshot y revisión compatible; al arrancar, recovery del journal precede al tráfico. Comprobar maestro, archivos, historial, procesados y usage. No restaurar solo el CSV ni reemplazarlo por la semilla. Si recovery falla, detener el servicio e investigar, conservando evidencia. El lock contiene PID; arranque detecta escritor vivo y rechaza una segunda instancia.

Verificación operativa local al volumen del servidor: `npx tsx scripts/inspect-state.ts <raíz-servidor>`. No se exponen endpoints administrativos de archivos. Herramienta live preparada, todavía sin validación real: `npm run verify:live`, únicamente con autorización `RUN_LIVE=1`, `LIVE_URL` HTTPS, `LIVE_STATE_ROOT` apuntando al **mismo volumen** y `SOURCE_REVISION`. Antes de habilitarla, revisar tarifas y configurar cuota global de evaluación ≤1000000; máximo 40 llamadas/2 intentos compartidos y USD5. No usar estado de terceros ni resetear una instancia pública. La verificación de navegador live está separada en `tests/live/`; su ejecución y el control completo del presupuesto siguen pendientes. No ejecutar por ahora.

Entregar fuente y lockfile; excluir `.env`, `out/`, `node_modules/`, `dist/` y resultados de pruebas. La propuesta de gobierno y los gates reales de release siguen abiertos en `tasks.md`.
