# Verificación local previa a release — 2026-10-22

Base Git: `6cdde66bd97b0fa08b5e28b15a5a9dcbe20e7bed`. Implementación en árbol de trabajo sin commit; **no es una revisión publicable ni release aprobado**. Node24.21.0/npm11.19.0/Windows. Instalación limpia de dependencias sobre el workspace existente, usando caché local; no se afirma instalación en otra máquina ni descarga total desde cero.

| Comando | Resultado observado |
| --- | --- |
| npm.cmd ci --offline --ignore-scripts | 128 paquetes,4.09s; lockfile reproducible |
| npm.cmd run typecheck | Pasa; strict y AST sin any explícito, incluye tests/frontend |
| npm.cmd test | Última ejecución:28 archivos/39 pruebas pasan,19.16s; red proveedor simulada |
| npm.cmd run build | Pasa; TypeScript+Vite8,3.17s de comando; bundle reproducible |
| npm.cmd run test:e2e | 3 Chromium pasan,7.6s |
| npm.cmd run demo | Pasa sin clave,2.18s; once contratos/seis procesados/cero duplicados |
| npx.cmd tsx scripts/inspect-state.ts | 11 IDs únicos,4 historial,4 archivos con hash correcto,0 journals,usage ausente (sin API) |
| npx.cmd tsx scripts/check-startup.ts | Build real: frontend200,health sin clave503,590.91ms arranque |
| npm audit --audit-level=low | 0 vulnerabilidades |

Setup de dependencias medido4.09s con caché. Repetición secuencial completa npm ci→typecheck→build→tests→navegador→demo→smoke:45.97s; arranque de esa pasada527.51ms. Tiempo total de preparación desde una máquina vacía **no medido** (Chromium requiere instalación separada). Arranque observado inferior a2min; no extrapolar a hosting.

Hallazgos: primeras ejecuciones tuvieron errores por prompt no copiado al harness, serialización de boolean CSV y sincronización de formulario; corregidos y probados. Una ejecución previa también presentó dos fallos intermitentes de IO/confirmación, no reproducidos en las siguientes suites completas; causa no demostrada, mantener observación en el entorno OneDrive. Errores intermedios de tipos del fake y escapado PowerShell del smoke se corrigieron; el smoke reproducible ahora vive en archivo TypeScript. No se atribuyen fallos no explicados a una causa inventada.

Gate local pasa en la última ejecución; permanecen abiertos verificación real OpenAI, URL pública, recuperación sobre servidor desplegado, propuesta externa de gobierno, documentación final, commit/revisión fuente y aprobación. No se ejecutó ningún servicio de pago. No hay hooks de extensiones instalados.

Revisión final: APP_TIMEZONE ahora se aplica explícitamente al reloj de bootstrap y de la sesión conversacional; prueba con fecha controlada y Pacific/Auckland pasa. Tras este ajuste se repitieron typecheck, suite39/39 y build; el gate secuencial anterior había pasado38/38 y navegador3/3.
