# Navegador local — 2026-10-22

`npm.cmd run test:e2e`: 3 pruebas Chromium pasan (última ejecución7.6s). Servidor separado con adaptador de seis fixtures, nunca seleccionable por HTTP. Verifica tabla, revisión de otrosí, frase parcial de §11 insuficiente para msg-006, fecha y póliza aportadas explícitamente, registro y recarga del historial. También verifica error de proveedor, límite de iteraciones, sesión conservada, escape de HTML y sesión inválida.

Primer intento falló por editar un formulario mientras el turno parcial aún terminaba; se agregó espera por la respuesta. Una edición intermedia del test introdujo caracteres mal codificados; se reescribió UTF-8. Ejecución corregida: 2/2. No equivale a prueba de navegador público ni modelo real.
