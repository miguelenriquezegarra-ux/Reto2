# Agente local — 2026-10-22

Adaptador controlado, sin clave ni consumo real: lote de seis mensajes, pendientes msg-003/msg-006, intento de confirmación del modelo rechazado, confirmación humana parcial preservada, confirmación completa, sesión ajena rechazada, maestro cambiado exige revisión nueva, turnos concurrentes rechazados y límite exacto de iteraciones. Pruebas en agent.test.ts, http-agent.test.ts, llm.test.ts y config-budget.test.ts.

No se ha validado conectividad, snapshot, calidad o uso real con OpenAI. Health informa configuración únicamente. Cambios relevantes: cuotas durables antes de fetch, proveedor reemplazable, presentación desde herramientas, confirmación ligada a candidato/revisión. Requiere revisión del dueño antes de merge/release.
