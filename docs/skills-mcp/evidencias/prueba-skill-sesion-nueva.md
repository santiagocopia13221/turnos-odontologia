Prompt recibido:
"Reglas: NO instales nada, NO hagas commit. Revisá la spec del change c-05b-api-minima-turnos-openapi contra las reglas de negocio del proyecto, usando la skill del proyecto que corresponda. Solo lectura, salvo el archivo del punto siguiente. Creá únicamente docs/skills-mcp/evidencias/prueba-skill-sesion-nueva.md con: el prompt que recibiste, qué skill cargaste y cómo lo supiste, y un resumen de 5 líneas del resultado."

Skill cargada: revisor-escenarios-turnos
Cómo lo supe: Consulté AGENTS.md (tabla "Skills Disponibles" / sección del proyecto) que indica usar "revisor-escenarios-turnos" para cambios que toquen turnos, solapamientos, disponibilidad, sillones, prestaciones, cancelación, reprogramación, reserva online o recordatorios. También cargué la skill explícitamente con functions.skill.

Resumen del resultado (5 líneas):
1. C-05b cubre bien serialización UTC/Z, IDs opacos, rechazo de duración manual, contigüidad por profesional/sillón/paciente con intervalos semiabiertos y prelación de errores 409.
2. Faltan coberturas críticas: RN-TU-05 (franja de atención) y RN-TU-06/RN-SI-04 (bloqueos de agenda/profesional/sillón) no se validan/documentan en este endpoint.
3. RN-PR-02 (prestación activa) y RN-SI-03 (sillón activo) se dejan fuera de alcance explícitamente pero requieren resolución antes del TPI (riesgo de validar tarde).
4. RN-RO-03 (asignación de sillón automática vs manual) queda como decisión abierta; C-05b exige referencias explícitas (correcto para su alcance) pero no resuelve la política.
5. Veredicto: CON OBSERVACIONES - el contrato HTTP es sólido para el MVP acotado, pero se deben cerrar bloqueos/franjas/activos antes de integrar con otros cambios del camino crítico.