## Revisión de escenarios — c-05b-api-minima-turnos-openapi

- Spec: openspec/changes/c-05b-api-minima-turnos-openapi/specs/api-turnos/spec.md
- Reglas: knowledge-base/05_reglas_de_negocio.md
- Alcance: Añadir POST /turnos sobre base C-05 con validación de borde, mapeo de errores a HTTP, serialización UTC, OpenAPI 3.0.3 y Swagger UI en /docs. Seed de demostración con IDs estables. Sin tocar dominio/C-01.

### Reglas RN involucradas

| RN | Requisito / escenario que la cubre | Estado |
|---|---|---|
| RN-TU-01 | Solapamiento por profesional (409 PROFESIONAL_OCUPADO) | cubierta |
| RN-TU-02 | Solapamiento por sillón (409 SILLON_OCUPADO) | cubierta |
| RN-TU-03 | Solapamiento por paciente (409 PACIENTE_OCUPADO) | cubierta |
| RN-TU-04 | Duración derivada de prestación | cubierta (mapeo a DURACION_INVALIDA cuando prestación sin duración >0) |
| RN-TU-07 | Fecha en el pasado (422 FECHA_EN_PASADO con reloj inyectado) | cubierta |
| RN-TU-08 | Intervalos semiabiertos [inicio, fin) (contigüidad) | parcial |
| RN-TU-09 | Turno CANCELADO no bloquea solapamiento | fuera de alcance |
| RN-PR-01 | Duración proviene de Prestacion | cubierta |
| RN-PR-02 | Prestación activa | fuera de alcance / ambigua |
| RN-PR-03 | duracionMinutos > 0 | cubierta vía DURACION_INVALIDA |
| RN-SI-01 | Ocupa exactamente un sillón | cubierta |
| RN-SI-02 | Sillón sin solapamientos | cubierta |
| RN-SI-03 | Solo sillones activos | fuera de alcance / ambigua |
| RN-GL-01 | Fechas con offset / zona horaria | cubierta |
| RN-GL-02 | IDs opacos | cubierta |
| RN-GL-03 | Configuración por entorno | fuera de alcance |

### Hallazgos

| # | Tipo | Severidad | Regla | Ubicación | Hallazgo | Escenario propuesto |
|---|---|---|---|---|---|---|
| 1 | FALTANTE | Alta | RN-TU-08 | Solapamientos como conflicto HTTP | Falta escenario explícito de contigüidad por sillón (fin == inicio no es solapamiento). | CUANDO el servidor usa reloj inyectado fijo 2026-11-03T12:00:00-03:00, existe un turno en sillon-1 que termina en 2026-11-10T12:30:00-03:00 y se envía POST /turnos con sillonId="sillon-1" e fechaHoraInicio="2026-11-10T12:30:00-03:00", ENTONCES responde 201 con estado=RESERVADO (contigüidad no es solapamiento). |
| 2 | FALTANTE | Alta | RN-TU-08 | Solapamientos como conflicto HTTP | Falta escenario explícito de contigüidad por paciente. | CUANDO el servidor usa reloj inyectado fijo 2026-11-03T12:00:00-03:00, paciente-ana tiene un turno que termina en 2026-11-10T12:30:00-03:00 y se envía POST /turnos con pacienteId="paciente-ana" e fechaHoraInicio="2026-11-10T12:30:00-03:00", ENTONCES responde 201 con estado=RESERVADO. |
| 3 | AMBIGÜEDAD / CONTRADICCIÓN POTENCIAL | Alta | RN-TU-01, RN-TU-02, RN-TU-03 | Solapamientos como conflicto HTTP | Si profesional, sillón y paciente están ocupados a la vez, no hay prelación definida. | CUANDO para el mismo intervalo solicitado prof-1, sillon-1 y paciente-ana están todos ocupados/solapados, ENTONCES responde 409 con código PROFESIONAL_OCUPADO (prelación: profesional primero, sillón después, paciente último). |
| 4 | FALTANTE | Alta | RN-TU-04, RN-PR-01 | Errores semánticos / Datos inválidos | No se rechaza explícitamente duracionMinutos enviado por el cliente. Debe ser 400 DATOS_INVALIDOS sin crear el turno. | CUANDO se envía POST /turnos con duracionMinutos: 45 junto a IDs válidos y prestación de 30 min, ENTONCES responde 400 con código DATOS_INVALIDOS y no se crea el turno (duración derivada de la prestación). |
| 5 | AMBIGÜEDAD | Alta | RN-PR-02, RN-SI-03 | Referencia inexistente | Dominio solo valida existencia; prestación/sillón activos sin código estable. | FUERA DE ALCANCE DE C-05b. Declarar explícitamente. Decisión abierta: ¿Quién valida Prestacion.activo y Sillon.activo, y con qué código de error? No existe código estable para 'referencia inactiva'. Resolver antes del TPI. |

### Decisiones abiertas (no inventar)

| Pregunta | Regla / documento | Por qué bloquea |
|---|---|---|
| ¿Quién valida Prestacion.activo y Sillon.activo, y con qué código de error? No existe código estable para 'referencia inactiva'. | RN-PR-02, RN-SI-03 / 05_reglas_de_negocio.md | 422 REFERENCIA_INEXISTENTE hoy cubre solo inexistencia. Requiere definición antes de validar inactivos. |
| ¿Asignación de sillón automática vs manual? | RN-RO-03, SU-05 / 10_preguntas_abiertas.md | C-05b exige sillonId explícito (correcto). Fuera de alcance. |
| ¿Proteger cancelar/reprogramar con token? | IN-02 / 10_preguntas_abiertas.md | No aplica a POST /turnos; relevante para próximos cambios. |

### Cobertura de casos de borde

| Caso | Regla | ¿Cubierto? | Observación |
|---|---|---|---|
| Contigüidad fin==inicio (profesional/sillón/paciente) | RN-TU-08 | Parcial | Requiere escenarios explícitos para sillón/paciente. |
| Turno CANCELADO no bloquea | RN-TU-09 | Fuera de alcance | Verificar en otros changes. |
| Fecha en el pasado / == ahora | RN-TU-07 | Sí | Con reloj inyectado. |
| Duración enviada por cliente | RN-TU-04, RN-PR-01 | Parcial | Falta rechazo explícito con 400 DATOS_INVALIDOS. |
| Referencia inexistente vs inactiva | RN-PR-02, RN-SI-03 | Parcial | Inactivos sin código; fuera de alcance. |
| Solapamiento tripartito con prelación | RN-TU-01,TU-02,TU-03 | Parcial | Falta definir prelación y escenario combinado. |
| Resto (franjas, bloqueos, cancelación/reprog, recordatorios, paciente online) | Varias | Fuera de alcance | No aplican a creación HTTP mínima. |

### Veredicto

CON OBSERVACIONES — El contrato es mayormente correcto. Agregar: escenarios de contigüidad por sillón/paciente, prelación profesional>sillón>paciente en solapamiento simultáneo, rechazo de duracionMinutos con 400 DATOS_INVALIDOS. Declarar Prestacion.activo/Sillon.activo fuera de alcance con pregunta abierta y resolver antes del TPI (sin inventar códigos).
