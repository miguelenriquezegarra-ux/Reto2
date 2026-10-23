# Research — Registro de Contratos Vigentes

Fecha: 2026-10-22. Fuentes de negocio: PRD completo, spec/Q1–Q5, ocho filas del maestro, tres comerciales y doce archivos del buzón (seis correos y seis adjuntos). Investigación técnica asistida por un agente de investigación, conforme al workflow Plan. No hay decisión de negocio nueva ni pregunta de Clarify abierta.

## R1. Runtime, interfaz y servidor

**Decision:** Node.js 24 LTS, TypeScript en modo strict, npm/lockfile; Express 5 sirve API y bundle Vite `vanilla-ts` del mismo origen. Desarrollo con un proceso Node/tsx y Vite en modo middleware, un comando `npm run dev`. Producción: compilación backend con tsc, frontend con Vite, `npm start`. Elegir versiones exactas compatibles al implementar y comprometer package-lock; no instalar dependencias durante Plan.

**Rationale:** Una pantalla de chat no necesita framework de componentes ni framework de agentes. Express reduce HTTP artesanal; Vite resuelve TypeScript del navegador y build. Un origen evita CORS y duplicar hosting. Node 24 satisface ≥20 y requisitos de Vite.

**Alternatives considered:** React añade componentes y dependencias innecesarios aquí; Next/serverless complica archivos durables; Bun no cumple la selección constitucional de runtime. [Node releases](https://github.com/nodejs/node/releases), [Express 5](https://expressjs.com/en/guide/migrating-5.html), [Vite](https://vite.dev/guide/).

## R2. Esquemas, CSV y pruebas

**Decision:** Zod 4 para fronteras/esquemas y conversión nativa JSON Schema; `csv-parse` y `csv-stringify` para comillas, Unicode y tipos explícitos. Vitest para unidades/contratos/integración y Playwright para chat. TypeScript, tsx, Vite, Vitest, Playwright y tipos Express/Node son dependencias de desarrollo; Express, Zod y los dos paquetes CSV, de ejecución. Usar APIs Node para filesystem, crypto, fetch y reloj; sin ORM, broker, BD ni librería de fechas.

**Rationale:** No dividir CSV por comas; no sustituir validación runtime por tipos. Mantener wire schemas JSON representables y refinamientos semánticos Zod separados; `z.toJSONSchema` no representa todos los transforms/refinements. Pruebas controladas no consumen modelo.

**Alternatives considered:** Parser CSV casero pierde casos de escape; ORM incumple alcance; agente SDK añade autoridad difícil de controlar. [Zod JSON Schema](https://zod.dev/json-schema), [CSV parse](https://csv.js.org/parse/), [CSV stringify](https://csv.js.org/stringify/), [Vitest](https://vitest.dev/guide/), [Playwright](https://playwright.dev/docs/intro).

## R3. Proveedor y ciclo LLM

**Decision:** Adaptador OpenAI por `fetch` a Chat Completions, proveedor `openai`, modelo configurable y snapshot inicial `gpt-5.4-mini-2026-03-17`. Interfaz propia `enviar(mensajes,herramientas)` devuelve texto/toolCalls/usage normalizados. Sin streaming ni herramientas alojadas del proveedor. Desactivar llamadas paralelas (`parallel_tool_calls=false`), limitar completions con `max_completion_tokens`, usar `reasoning_effort=none` y no enviar parámetros no verificados. Wire schema sin strict de proveedor para preservar `confirmado?`; toda llamada se valida de nuevo con Zod en aplicación. No hay reintentos automáticos de peticiones facturables.

**Rationale:** Herramientas pequeñas, contexto local y control de autorización no requieren framework. Snapshot reduce cambios de comportamiento; seguir validando porque no hace determinista el modelo. Acceso efectivo al modelo se comprueba con la clave real en el release, no se supone por documentación.

**Alternatives considered:** SDK oficial es válido pero no necesario para un endpoint; Responses también válido, pero agrega tipos de eventos no necesarios para este intercambio. Modelos inicialmente considerados deprecados se descartaron. [Modelo y precios oficiales](https://developers.openai.com/api/docs/models/gpt-5.4-mini), [Function calling](https://developers.openai.com/api/docs/guides/function-calling). Precios documentados para este plan: USD 0.75/M entrada y USD 4.50/M salida, sin asumir descuentos de caché. Revalidarlos al entregar.

## R4. Confianza, extracción y comparación

**Decision:** Extracción por secciones/cláusulas y regex genéricas, nunca por ID de mensaje. Mantener evidencia y origen por campo. Confianza técnica inicial: explícito inequívoco validado 0.95; normalización inequívoca 0.90; ausencia 0; derivación de fecha desde inicio exacto/plazo 0.75; valor por demanda 0.75 y `valor=0`, `valor_indeterminado=true`; dato contradictorio o condicional sin resolución 0.50. Estos números son heurísticas documentadas, no probabilidades calibradas. Datos generados por sistema y catálogo tienen procedencia propia; confianza de extracción ausente no se falsea para evitarlos.

Partes: extraer la contraparte, no Periferia. Fechas: soportar números entre paréntesis y meses españoles; no confundir firma con inicio, ni umbral de póliza con importe contractual. Preservar identificadores como strings (incluido cero inicial HN); retirar puntos y sufijo de verificación explícito en NIT CO, sin cortar dígitos de RUC/RTN solo por longitud. Objeto se normaliza por espacios y se limita a 200 caracteres sin enriquecer contenido. Importes con moneda explícita y separadores COP/USD/PEN pasan por parser decimal y finitud; valor indeterminado no se convierte en un importe supuesto.

Similitud técnica elegida: `1 - distancia_Levenshtein(a,b)/max(longitud(a),longitud(b))`, con Unicode NFKD, eliminación de diacríticos, minúsculas, puntuación→espacios y espacios colapsados. Objetos vacíos no son candidatos. Comparar ≥0.9 solo con mismo identificador tributario normalizado; igualdad de ID tiene prioridad. Q3: otrosí primero, RN1 en ordinarios, luego RN2/RN3; RN4 precede al procesamiento contractual cuando no hay documento identificable. Si varios candidatos satisfacen similitud sin un ID exacto, devolver conflicto revisable, sin elegir ni modificar arbitrariamente.

**Rationale:** Resultados reproducibles, umbrales PRD intactos y fixture msg-004 duplicado por los cuatro campos, sin que la redacción del objeto active RN2. El otrosí hereda solo campos no modificados del maestro, manteniendo procedencia `maestro`; las diferencias documentadas se muestran y revisan según HU-3.

**Alternatives considered:** Embeddings/LLM para identidad no deterministas y agregan costo; igualdad de nombre de cliente genera falsos positivos; fechas asumidas para msg-006 violan Q1. El mecanismo no es una regla nueva de negocio sino la definición verificable del método dejado a Plan.

## R5. Confirmación y valores afirmables

**Decision:** Estado pendiente y autorización server-side por sesión, mensaje, hash del candidato y revisión del maestro. El modelo no posee autoridad para conceder `confirmado`. La interfaz presenta formulario de campos revisables; la respuesta humana incluye su mensaje y una acción estructurada ligada al pendiente. El botón/formulario envía el siguiente mensaje humano, no crea una tool call especial. Una frase inequívoca «confirmo» puede confirmar el candidato completo mostrado; correcciones explícitas pasan como valores humanos al mismo validador. Si faltan datos, la confirmación parcial no registra. No interpretar una propuesta del modelo como dato humano.

En llamadas directas de demo, `confirmado=true` es la declaración explícita del operador confiable, como exige §6.6, sobre una entrada etiquetada humana. El ejecutor conversacional emplea un runtime con política de confirmación obligatoria; no puede cambiar a la política demo mediante argumentos HTTP/LLM. No cambiar el contrato público execute(args,{directory,sessionId}).

**Rationale:** Cumple CA3 sin confiar en la interpretación probabilística de un «sí». CA2 se refuerza con un panel/resumen determinista construido de resultados: los hechos contractuales mostrados se renderizan desde las herramientas; texto libre del modelo se restringe a intención/preguntas. Una salida del modelo con datos fuera de resultados se omite en favor del resumen verificado, no se presenta como hecho.

**Alternatives considered:** Prompt-only/boolean del modelo permiten bypass; agregar login/roles excede alcance; aceptar literalmente la frase abreviada §11 como todos los datos inventaría inicio/póliza.

## R6. Consistencia local

**Decision:** Un proceso, un escritor, mutex compartido por lecturas y escrituras; journal temporal con imágenes antes/después y hashes en `out/.transactions/`. Staging y rename por archivo, commit marker durable, recuperación antes de atender solicitudes. Historial JSONL se conserva y se agrega lógicamente una línea, publicando el nuevo archivo por rename para hacer recuperable la operación. No pretender transacción filesystem atómica entre todos los archivos.

**Rationale:** Ocho filas iniciales y un buzón pequeño justifican snapshots de archivos, no una BD. Fallos antes de commit se revierten antes de exponer datos; después de commit se completa publicación/respuesta idempotente. Guardar recibo por mensaje/hash impide reaplicar un otrosí en reintento. Archivar la versión activa en la ruta obligatoria; el journal protege el archivo anterior durante la transacción, no introduce un servicio de versionado documental fuera de alcance.

**Alternatives considered:** Escrituras sueltas pierden invariantes al fallar; transacción distribuida no aplica a carpetas locales; múltiples procesos necesitan coordinación que el reto no exige. Garantías específicas y casos de fallo en data-model.md.

## R7. Deployment

**Decision:** Un web service Render de pago con Node 24, una instancia y disco persistente montado en `/opt/render/project/src/out`. Build `npm ci && npm run build`, start `npm start`, host `0.0.0.0`, puerto de `PORT`, health `/api/health`. Fixtures y prompt en la revisión desplegada; inicialización de out solo en arranque cuando no existe maestro. Sin limpieza automática de out en servicio.

**Rationale:** Mismo layout lógico local/deploy; archivos se conservan entre reinicios. El disco requiere instancia única y puede introducir parada breve al desplegar. Asegurar disponibilidad en defensa y una copia de recuperación antes de actualizar. [Render disks](https://render.com/docs/disks), [Render Node](https://render.com/docs/deploy-node-express-app).

**Alternatives considered:** Hosting efímero pierde maestro; BD cambia alcance; túnel estable sobre proceso local durable es alternativa pública permitida por §9.3 si no se dispone de cuenta/disco, exige mantener equipo/URL disponibles y repetir todos los checks sobre esa URL. Defensa solo local con penalización no satisface release constitucional. Plan no contrata ni despliega servicios.

## Resultado

Decisiones técnicas resueltas. Credenciales, cuenta con disco o túnel estable y URL efectiva son dependencias de implementación/release; no se inventan como disponibles. Presupuestos y matrices verificables se concretan en plan.md y quickstart.md. No quedan marcadores de aclaración pendientes.
