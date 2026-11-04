## Revisión de escenarios — c-05b-api-minima-turnos-openapi

- Spec: openspec/changes/c-05b-api-minima-turnos-openapi/specs/api-turnos/spec.md
- Reglas: knowledge-base/05_reglas_de_negocio.md
- Alcance: Añadir POST /turnos sobre base C-05 con validación de borde, mapeo de errores a HTTP, serialización UTC, OpenAPI 3.0.3 y Swagger UI en /docs. Seed de demostración con IDs estables. Sin tocar dominio/C-01.

### Reglas RN involucradas

| RN | Requisito / escenario que la cubre | Estado |
|---|---|---|
| RN-TU-01 | Solapamiento por profesional (409 PROFESIONAL_OCUPADO) + prelación | cubierta |
| RN-TU-02 | Solapamiento por sillón (409 SILLON_OCUPADO) + prelación | cubierta |
| RN-TU-03 | Solapamiento por paciente (409 PACIENTE_OCUPADO) + prelación | cubierta |
| RN-TU-04 | Duración derivada de prestación | cubierta (rechazo de duracionMinutos con 400 DATOS_INVALIDOS) |
| RN-TU-07 | Fecha en el pasado (422 FECHA_EN_PASADO con reloj inyectado) | cubierta |
| RN-TU-08 | Intervalos semiabiertos [inicio, fin) (contigüidad fin==inicio) | cubierta |
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
| 1 | OK | - | RN-TU-04, RN-PR-01 | Requirement: Datos de entrada inválidos / Scenario: Duración enviada por el cliente | Se agrega escenario que rechaza duracionMinutos enviado por cliente con 400 DATOS_INVALIDOS y sin crear el turno. | Ya cubierto en spec.md (líneas añadidas). |
| 2 | OK | - | RN-TU-08 | Requirement: Referencias explícitas de paciente y sillón / Scenarios: Contigüidad por sillón y por paciente | Se agregan escenarios explícitos de contigüidad fin==inicio con respuesta 201 para sillón y para paciente, usando reloj inyectado 2026-11-03T12:00:00-03:00. | Ya cubierto en spec.md. |
| 3 | OK | - | RN-TU-01, RN-TU-02, RN-TU-03 | Requirement: Solapamientos como conflicto HTTP / Scenario: Conflicto simultáneo con prelación de códigos | Se define prelación profesional > sillón > paciente y se agrega escenario combinado con respuesta 409 PROFESIONAL_OCUPADO. | Ya cubierto en spec.md y D12 en design.md. |
| 4 | OK | - | RN-PR-02, RN-SI-03 | Requirement: Referencias explícitas de paciente y sillón (texto) / design.md Decisión abierta | Se declara explícitamente fuera de alcance de C-05b; dominio solo valida existencia. Se agrega pregunta abierta sin inventar código de error. | Ya cubierto en spec.md y design.md. |
| 5 | OK | - | N/A (infra/CDN) | design.md D8 | Se cambia a versión exacta 5.11.0 de swagger-ui-dist en unpkg (swagger-ui.css y swagger-ui-bundle.js), aclarando que no se usa swagger-ui-standalone-preset.js. | Ya cubierto en design.md. |

### Decisiones abiertas (no inventar)

| Pregunta | Regla / documento | Por qué bloquea |
|---|---|---|
| ¿Quién valida Prestacion.activo y Sillon.activo, y con qué código de error? No existe código estable para el caso 'referencia inactiva'. Debe resolverse antes del TPI. | RN-PR-02, RN-SI-03 / design.md (Decisión abierta) | C-05b traduce REFERENCIA_INEXISTENTE a 422 pero solo cubre inexistencia. Si se requiere rechazar inactivos, hace falta un código nuevo o reutilizar uno existente (no inventar). |

### Cobertura de casos de borde

| Caso | Regla | ¿Cubierto? | Observación |
|---|---|---|---|
| Contigüidad fin==inicio (profesional/sillón/paciente) | RN-TU-08 | Sí | Cubierto para sillón y paciente con respuesta 201. Prelación aplica en conflicto simultáneo. |
| Turno CANCELADO no bloquea | RN-TU-09 | Fuera de alcance | No aplica a creación. |
| Fecha en el pasado / == ahora | RN-TU-07 | Sí | Con reloj inyectado. |
| Duración enviada por cliente | RN-TU-04, RN-PR-01 | Sí | Rechazada con 400 DATOS_INVALIDOS. |
| Referencia inexistente vs inactiva | RN-PR-02, RN-SI-03 | Parcial | Inexistencia cubierta (422). Inactivos fuera de alcance, sin código definido (decisión abierta). |
| Solapamiento tripartito con prelación | RN-TU-01, RN-TU-02, RN-TU-03 | Sí | Definido en spec y D12 (profesional > sillón > paciente). |
| Resto (franjas, bloqueos, cancelación/reprog, recordatorios, paciente online) | Varias | Fuera de alcance | No aplican a creación HTTP mínima. |

### Veredicto

OK — Los 5 puntos solicitados están cubiertos en spec.md y design.md con escenarios CUANDO/ENTONCES verificables, uso de códigos existentes (DATOS_INVALIDOS, PROFESIONAL_OCUPADO, etc.), prelación definida, contigüidad por sillón/paciente, rechazo de duracionMinutos, referencias inactivas declaradas fuera de alcance con pregunta abierta (sin inventar código), y D8 corregido a swagger-ui-dist 5.11.0 sin swagger-ui-standalone-preset.js. Tasks actualizadas para los nuevos escenarios.
