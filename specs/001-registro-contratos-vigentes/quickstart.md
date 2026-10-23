# Quickstart de verificación — diseño, todavía no implementación

Guía de comandos y resultados que la implementación debe proporcionar. Los comandos npm siguientes son contratos de scripts futuros, no comandos ya disponibles o ejecutados en Plan. No crear documentación de entrega raíz hasta Implement. Referencias: [plan](plan.md), [modelo/archivos](data-model.md), [contratos](contracts/interfaces.md), [spec](spec.md).

## 1. Prerrequisitos y configuración

- Node.js 24 LTS y npm compatibles con package-lock; Windows o Linux. Para tests de navegador, Chromium instalado mediante Playwright.
- Revisión Git con fixtures intactos y, cuando se implemente, package-lock.json. No incluir out, node_modules, .env ni secretos en entrega.
- Copiar .env.example a .env localmente y completar solo variables backend para chat real. Jamás imprimir clave ni copiarla a archivos versionados/front. Demo y tests controlados deben funcionar sin OPENAI_API_KEY.
- Variables previstas: PORT, OPENAI_API_KEY, LLM_MODEL, AGENT_MAX_ITERATIONS, LLM_MAX_COMPLETION_TOKENS, SESSION_TOKEN_BUDGET, GLOBAL_TOKEN_BUDGET, LLM_TIMEOUT_MS, AGENT_TURN_TIMEOUT_MS, APP_TIMEZONE. Defaults no secretos documentados en plan; valores positivos y finitos validados con Zod. Rechazar configuración que elimina límites. No permitir URL proveedor libre desde frontend.

## 2. Instalación y arranque local

Desde la raíz de revisión del proyecto:

```text
npm ci
npx playwright install chromium
npm run dev
```

`npm run dev` inicia frontend y backend juntos con tsx/Vite middleware; URL local por defecto http://localhost:3000. El proceso se puede iniciar sin clave para inspección estática, pero el chat informa indisponibilidad de configuración sin enviar peticiones; demo no importa inicialización de proveedor. Configuración inválida no se trata como credencial ficticia.

Medir arranque desde comando dev hasta interfaz y health disponibles: <2min. Registrar tiempo de instalación y setup completo en máquina limpia además del tiempo de arranque; si no cumple el alcance de medición exigido por evaluador, reportar el resultado real y corregir, no excluirlo silenciosamente. README debe reproducirlo.

## 3. Verificación temprana sin modelo

```text
npm run typecheck
npm test
npm run demo
npm run demo
```

`npm run demo` ejecuta demo.ts con tsx, fija fecha de ejecución 2026-09-03 y llama las cinco herramientas directamente con ctx de raíz de prueba/local. Antes de limpiar out, verificar ruta resuelta dentro de raíz, no fixtures, y ausencia de proceso escritor. No ejecutar sobre instancia pública ni sobre estado que se desea conservar. Guardar backup si es una copia local usada previamente.

Oracles:

| Caso | Primera pasada | Tras revisar/confirmar cuando corresponde |
| --- | --- | --- |
| msg-001 | nuevo, póliza pendiente, alta si sin revisión | CT-2026-015, 265000000 COP, fin2027-07-31 |
| msg-002 | nuevo, sin póliza, alta si sin revisión | CT-2026-016, 120000 USD, no_aplica |
| msg-003 | actualizacion, mostrar diferencias/revisión aplicable | Misma CT-2026-011, 520000 PEN, fin2027-11-01; conserva otros datos y fecha_registro2026-05-05; historial |
| msg-004 | duplicado, cierre operativo/log | Sin maestro/archivo/historial nuevos; no reaparece pendiente |
| msg-005 | rechazado con motivo, cierre operativo/log | Sin alta/archivo/historial; no reaparece pendiente |
| msg-006 | nuevo, valor/fin en revisión, inicio null/0 y póliza pendiente de revisión; sin registro | Solo después de datos humanos explícitos, validación y confirmado:true; CM-2026-03 |

La demo imprime por mensaje clasificación, campos en revisión y acción. Muestra rechazos al intentar registrar pendientes sin confirmar; deja todos los que requieren revisión sin registrar en primera pasada. En segunda pasada demuestra llamada directa con confirmado:true para un caso pendiente; completar también cualquier revisión del otrosí para verificar resultado final integral. Las herramientas nunca recurren al modelo para resolver ausencias.

Datos humanos simulados de demo/tests se guardan como entradas de prueba separadas, con etiqueta de origen humano; no son fixtures contractuales ni valores por defecto del producto. Para probar ambos ramos Q2, usar dos ejecuciones aisladas que aporten una fecha precisa dentro del mes documentado, decisión explícita requiere/no requiere y moneda. No fijar aquí una fecha o política como verdad del contrato. Verificar que el usuario puede elegir otro día válido sin que el programa lo reemplace; una confirmación parcial valor0/fin2027-08-31 deja pendientes los otros campos. Las entradas humanas del smoke se registran como evidencia de evaluación, no modificación de fixture.

Tras completar las tres altas y la actualización: once filas, identificadores únicos; archivos TXT copiados con hash igual; cuatro líneas contractuales por las tres altas y una actualización, sin líneas por duplicado/rechazado; todos los seis mensajes cerrados al finalizar. Primera pasada: dos altas limpias, msg-006 sin alta y otrosí actualizado solo si su revisión fue resuelta; el conteo de filas tras dos altas es diez aun si actualización sigue pendiente. Nunca considerar parcial como éxito final.

`out/alertas.md` con tres secciones. Al hoy fijo, vencen CT-2026-004 y CT-2026-009; pendientes CT-2026-004 y CT-2026-015, más msg-006 solo si humano declara que requiere. Desde corte: las tres nuevas altas después de confirmar, no CT-2026-011 por actualización. Reinicios de demo producen mismos archivos/resultados salvo timestamps; comparar canonicalizando solo timestamps/IDs técnicos de correlación, sin omitir campos de negocio.

## 4. Pruebas automatizadas de integridad y errores

`npm test` agrupa suites controladas; no necesita red ni clave:

- Parsers de fechas/importes/país/identificadores/objeto; ausencia null/0 vs documento vacío; moneda inválida/fecha inválida → error, no throw; regla exacta del umbral0.8.
- Q3: duplicado ordinario aunque cambie descripción, otrosí explícito aunque coincidan cuatro campos, similitud justo ≥0.9 con NIT igual, múltiples candidatos en revisión.
- Confirmación: boolean del modelo no autoriza, sesión ajena/hash viejo no autoriza, respuesta parcial no completa inicio ni póliza, candidato editado revalidado, llamada directa confiable distinta de HTTP.
- Q4: cierres operativos de rechazo/duplicado y lectura posterior; fallo recuperable/revisión no cierra. Repetir registro tras respuesta perdida no duplica filas/historial.
- Journal: fallo en cada rename/publicación/marker, recuperación tras reinicio, rollback fallido bloquea estado; ningún fixture cambiado, fila e historial consistentes y adjunto anterior recuperable.
- Q5: hoy/día60 incluidos, pasado/día61 excluidos; fecha de alta no cambia al actualizar, corte inclusivo; fecha exacta inexistente no se inventa.
- Zod de solicitudes/args/estado/provider; JSON malformado devuelto al modelo como error; sesión sobrevive a provider error/timeout y lote continúa ante mensaje malo.
- Config/consumo: límites de iteración/token/tiempo detienen sin nueva llamada; nueva sesión y reinicio no eluden presupuesto; timeout conserva reserva; llamadas concurrentes no gastan la misma reserva dos veces.
- Seguridad: traversal/absolutas/symlink fuera de raíz, herramientas desconocidas, inyección en documento no cambia autorizaciones, HTML externo no ejecuta código, secreto falso de prueba ausente de UI/log/API/bundle.

## 5. Aplicación integrada con modelo controlado

```text
npm run test:e2e
npm run build
npm start
```

Playwright levanta una instancia aislada del servidor con adaptador falso seleccionado solo por harness local de test, sin ruta/config remota que lo active. Comprueba historial, pensando, tool calls visibles, revisión resaltada, datos humanos/confirmación y reporte; cubre error/timeout/límites. Build genera dist/src y dist/web; start sirve esos artefactos y API juntos. Health informa readiness local; no demuestra modelo real.

En chat nuevo enviar la solicitud textual de PRD §11 con hoy2026-09-03. Observar tabla por mensaje, llamadas y pregunta. Responder solo «confirmo el valor 0 y la fecha fin 2027-08-31»: no debe inventar fecha_inicio ni decidir póliza. Completar datos precisos solicitados y confirmar candidato. Conservar discrepancia con ejemplo original como Q1–Q2, sin afirmar que la frase sola cumplió el registro completo.

## 6. Release público y comprobación real

Prerrequisitos externos: cuenta de Render con disco persistente o alternativa de túnel estable, clave propia con acceso al snapshot y presupuesto suficiente, revisión fuente identificada. No se crean ni pagan recursos con Plan.

Render: raíz del repositorio, Node24, build `npm ci && npm run build`, start `npm start`, una instancia, disco en `/opt/render/project/src/out`, variables secretas por dashboard, PORT suministrado. Health `/api/health`; no reseed estado existente. Asegurar HTTPS/URL activa y registrar su valor en README/evidencia, no usar un placeholder como URL verificada.

```text
npm run verify:live -- --url https://URL-REAL-DE-EVALUACION
```

Contrato del futuro script: usa solo API pública para verificar configuración/conectividad/agent real y produce evidencia segura; la clave permanece en backend. Seguir escenario integral y confirmación humana con datos de evaluación explícitos; no pedir un reset público ni ejecutar demo en servicio remoto. Preparar un entorno de evaluación propio o backup coherente antes del check. Con una sola instancia de reto, detener servicio para inicializar estado controlado localmente y registrar operación, sin perder datos no respaldados.

Techo compartido del check, incluyendo máximo dos intentos: 1000000 tokens, 40 llamadas, USD5 estimados con tarifas verificadas en plan; verificar cuota antes de cada llamada. No ejecutar retries sin límite. Medir usage y precio de todas las rondas; si cambia tarifa/modelo, ajustar reserva para mantener techo antes de ejecutar.

Pass/fail: frontend/API/agente usan revisión deseada; proveedor responde realmente, herramientas reales ejecutadas con calls/log visibles; control humano bloquea datos dudosos; resultado final y alertas coinciden con oracles; presupuesto y tiempos respetados. Si proveedor inaccesible, exceso de costo, confirmación insegura o resultados incorrectos: fail, no liberar. Registrar SHA, URL, modelo, configuración no secreta, costo, resultados y aprobación del dueño. Reiniciar servicio y comprobar persistencia del maestro/archivos/usage; el historial de sesión en memoria puede perderse con explicación clara.

## 7. Entregables y recuperación

Antes de aprobar release, revisar SOLUCION.md con once secciones/una página de gobierno, README/.env.example reproducibles, source/commits significativos, exclusiones y ausencia de claves también en historial. P1/bonus siguen opcionales, su ausencia no se reporta como defecto P0. La rúbrica numérica referida por PRD no se inventa.

Backup: parar mutaciones/servicio, copiar out completo a destino seguro del dueño y registrar revisión. Recuperar restaurando conjunto coherente y revisión compatible; arrancar journal recovery antes de aceptar solicitudes; repetir health, invariantes y un check acotado según presupuesto restante. No copiar fixture encima de producción para tapar un fallo ni restaurar solo el CSV.

La entrega local con penalización del PRD se conserva como posibilidad del ejercicio, pero no cumple el gate constitucional de release público. Cuenta/clave/URL pendientes son riesgos de ejecución, no justifican borrar el trabajo de deployment de Tasks.
