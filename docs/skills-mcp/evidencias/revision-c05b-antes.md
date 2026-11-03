## Revisión de escenarios — c-05b-api-minima-turnos-openapi

- Spec: `openspec/changes/c-05b-api-minima-turnos-openapi/specs/api-turnos/spec.md`
- Reglas: `knowledge-base/05_reglas_de_negocio.md`
- Alcance: capa HTTP sobre el dominio existente — `POST /turnos` con referencias explícitas, mapeo estable de errores de dominio, `GET /openapi.json`, `GET /docs` y seed de demo con IDs estables.

### Reglas RN involucradas

| RN | Requisito / escenario que la cubre | Estado |
|---|---|---|
| RN-TU-01 | "Profesional ocupado" → `409 PROFESIONAL_OCUPADO` | cubierta |
| RN-TU-02 | "Sillón ocupado" / "Sillón ocupado no se reasigna" | cubierta (duplicada) |
| RN-TU-03 | "Paciente ocupado" → `409 PACIENTE_OCUPADO` | cubierta |
| RN-TU-04 | "Duración inválida"; cuerpo sin campo de duración | parcial |
| RN-TU-05 | — (franjas de atención) | fuera de alcance (C-02) |
| RN-TU-06 | — (bloqueos de agenda) | fuera de alcance (C-02) |
| RN-TU-07 | "Fecha en el pasado" → `422 FECHA_EN_PASADO` | ambigua |
| RN-TU-08 | "Reserva exitosa" (`fechaHoraFin`), solapamientos como `409` | parcial |
| RN-TU-09 | — (cancelado no bloquea) | cubierta en spec de dominio; no ejercitada por HTTP |
| RN-PR-01 | "Duración inválida" / fin derivado | parcial |
| RN-PR-02 | — (prestación activa) | ausente |
| RN-PR-03 | "Duración inválida" | cubierta |
| RN-SI-01 | `sillonId` obligatorio (un sillón por turno) | cubierta |
| RN-SI-02 | "Sillón ocupado" | cubierta |
| RN-SI-03 | — (solo sillones activos) | ausente |
| RN-SI-04 | — (bloqueos de sillón) | fuera de alcance (C-02) |
| RN-CA-01..04 | — (cancelar/reprogramar) | fuera de alcance (C-08/C-09) |
| RN-RO-01/02 | "Referencias explícitas de paciente y sillón" (no resuelve por teléfono) | fuera de alcance (C-03), correctamente declarado |
| RN-RO-03 | `sillonId` obligatorio | fuera de alcance (C-04) — asume asignación manual |
| RN-RE-01..03 | — | fuera de alcance (C-12/C-13) |
| RN-GL-01 | "Fecha de inicio con offset explícito", serialización del fin | parcial |
| RN-GL-02 | "`id` no vacío", IDs de demo | ambigua/contradicción |
| RN-GL-03 | Sin nuevas variables (D10) | N/A |

### Hallazgos

| # | Tipo | Severidad | Regla | Ubicación | Hallazgo | Escenario propuesto |
|---|---|---|---|---|---|---|
| 1 | CONTRADICCIÓN | Alta | RN-TU-07 | "Reserva exitosa" y "Ejemplo documentado funciona" | El ejemplo usa `2026-10-20T09:00:00-03:00`, que ya está en el pasado respecto del reloj real (2026-11-03). El escenario "Ejemplo documentado funciona… contra el servidor de demostración" respondería `422 FECHA_EN_PASADO` y no puede pasar como está escrito. | **CUANDO** el reloj del servidor de demo es `2026-11-03T12:00:00-03:00` y se envía el ejemplo publicado con `2026-11-10T10:00:00-03:00`, **ENTONCES** responde `201`. (El ejemplo debe usar fecha futura o el demo debe exponer un reloj fijo documentado.) |
| 2 | AMBIGÜEDAD | Media | RN-TU-07 | "Fecha en el pasado" | "anterior al reloj del servidor" no dice si el reloj es inyectable (el dominio sí usa `ahora` inyectado) ni qué pasa en el borde `inicio == ahora`. Un tester no puede decidir sin leer el código. | **CUANDO** el reloj inyectado es `2026-11-10T10:00:00-03:00` y `fechaHoraInicio` es exactamente ese instante, **ENTONCES** responde `201`. |
| 3 | AMBIGÜEDAD | Media | RN-TU-04 / RN-PR-01 | "Creación de turno por HTTP" / "Datos de entrada inválidos" | La spec no define qué pasa si el cliente manda `duracionMinutos` en el cuerpo: ¿se rechaza o se ignora? Si se ignora, no hay verificación de que el cliente no fije la duración. | **CUANDO** el cuerpo incluye `duracionMinutos = 60` y `prestacionId` apunta a una prestación de 30 min, **ENTONCES** responde `400 DATOS_INVALIDOS` y no crea el turno. |
| 4 | FALTANTE | Media | RN-PR-02 / RN-SI-03 | "Errores semánticos de la reserva" | El mapeo `422` cubre "no existe" pero no "existe e inactivo". `turnosService` hoy solo valida existencia (verificado en `src/application/turnosService.js:20`), así que una prestación o sillón `activo = false` crearía el turno. Hay que declararlo fuera de alcance o definirlo. | **CUANDO** `prestacionId` existe con `activo = false`, **ENTONCES** responde `422` con un código estable y no crea (código a decidir, ver Decisiones abiertas). |
| 5 | AMBIGÜEDAD | Media | RN-TU-01 / RN-TU-02 / RN-TU-03 | "Solapamientos como conflicto HTTP" | Con un conflicto simultáneo por profesional, sillón y paciente no se define qué `error.code` prevalece; cada test elegiría uno distinto. | **CUANDO** el profesional, el sillón y el paciente ya tienen turno solapado en el mismo intervalo, **ENTONCES** responde `409` con el código que el contrato fije como prioritario (documentar la prelación). |
| 6 | AMBIGÜEDAD | Media | RN-GL-01 / RN-TU-08 | "Reserva exitosa" | "`fechaHoraFin` equivalente a `09:30:00-03:00` expresada como instante ISO 8601" admite `…T12:30:00.000Z` o `…T09:30:00.000-03:00`; el design (D6) dice UTC. Un test estricto no puede decidir. | **CUANDO** se crea un turno con inicio `2026-11-10T09:00:00-03:00` y prestación de 30 min, **ENTONCES** `fechaHoraFin` es exactamente `"2026-11-10T12:30:00.000Z"` (o el formato que el contrato fije). |
| 7 | FALTANTE | Media | RN-TU-08 | "Solapamientos como conflicto HTTP" | Solo se prueban solapamientos; no hay escenario HTTP de borde contiguo (`fin == inicio`) para sillón ni paciente. La regla está en la spec de dominio, pero un tester de esta capa podría esperar `409`. | **CUANDO** el Sillón 1 tiene un turno que termina `2026-11-10T09:30:00-03:00` y se crea otro en el Sillón 1 que inicia a esa hora, **ENTONCES** responde `201`. (Análogo para paciente.) |
| 8 | FALTANTE | Media | RN-TU-01 / RN-TU-02 / RN-TU-03 | "Ejemplo documentado funciona" | No se define si el ejemplo publicado es idempotente ni si el seed ocupa ese horario. Invocarlo dos veces contra el mismo proceso en memoria daría `409`, contradiciendo el escenario sin explicar el reset. | **CUANDO** se invoca dos veces el ejemplo publicado sin reiniciar el servidor, **ENTONCES** la segunda responde `409` (y el escenario debe aclarar si eso es esperado o si el ejemplo varía el inicio). |
| 9 | FALTANTE | Baja | RN-GL-02 | "Datos de entrada inválidos" | El requisito menciona "tipo incorrecto" pero no hay escenario que lo ejercite; con IDs como strings opacos es el caso natural. | **CUANDO** `pacienteId` es el número `123`, **ENTONCES** responde `400 DATOS_INVALIDOS` y no crea el turno. |
| 10 | AMBIGÜEDAD | Baja | RN-GL-02 | "IDs de demostración utilizables" | La regla pide IDs opacos (UUID) generados por el sistema, pero el seed de demo usa IDs fijos tipo `prof-1`. Falta declarar la excepción de fixtures en el contrato. | **CUANDO** se envía `profesionalId = "prof-1"` del seed de demo, **ENTONCES** responde `201` (fixtures documentados como excepción a RN-GL-02). |

### Decisiones abiertas (no inventar)

| Pregunta | Regla / documento | Por qué bloquea |
|---|---|---|
| ¿La asignación de sillón es manual (la recepción envía `sillonId`) o automática? | RN-RO-03, SU-05, pregunta Alta en `10_preguntas_abiertas.md` | C-05b asume manual al exigir `sillonId`, lo que contradice SU-05; debe confirmarse o declararse como corte temporal explícito. |
| ¿Quién valida `Prestacion.activo`/`Sillon.activo` (RN-PR-02/RN-SI-03): C-05b, C-04 o C-06? | RN-PR-02, RN-SI-03, hallazgo #4 | Hoy el dominio no las valida; sin dueño definido, el contrato HTTP queda silenciosamente incompleto. |
| ¿Qué código estable usar para "referencia inactiva"? | `src/domain/errors.js`, hallazgo #4 | No existe un código para ese caso; inventarlo rompería la estabilidad del contrato. |
| ¿El seed de demo puede usar IDs no-UUID (`prof-1`) como excepción a RN-GL-02? | RN-GL-02, hallazgo #10 | Si no, el seed debe usar UUIDs fijos, no strings legibles. |

### Cobertura de casos de borde

| Caso | Regla | ¿Cubierto? | Observación |
|---|---|---|---|
| Turno contiguo por profesional/sillón/paciente | RN-TU-08 | Parcial | Dominio cubierto; sin escenario HTTP (hallazgo #7). |
| Turno cancelado no bloquea | RN-TU-09 | Fuera de alcance | No hay endpoint de cancelación; cubierto en spec `turnos`. |
| Fecha en el pasado | RN-TU-07 | Parcial | Borde `== ahora` y reloj inyectado sin definir (#2). |
| Duración inválida/manual | RN-TU-04, RN-PR-01, RN-PR-03 | Parcial | `<= 0` cubierto; envío de duración por el cliente, no (#3). |
| Referencia inexistente / inactiva | RN-PR-02, RN-SI-03, RN-GL-02 | Parcial | "No existe" cubierto; "inactivo" ausente (#4). |
| Franja de atención | RN-TU-05 | Fuera de alcance | C-02. |
| Bloqueo de agenda | RN-TU-06, RN-SI-04 | Fuera de alcance | C-02. |
| Solapamiento tripartito | RN-TU-01..03, RN-SI-02 | Parcial | Casos individuales cubiertos; prelación de códigos ambigua (#5). |
| Estados del turno | RN-TU-09, RN-CA-03 | Fuera de alcance | Solo se crea `RESERVADO`; cancelar/reprogramar en C-08/C-09. |
| Ventana de cancelación | RN-CA-01, RN-CA-04 | Fuera de alcance | C-08. |
| Reprogramación | RN-CA-02 | Fuera de alcance | C-09. |
| Asignación de sillón | RN-RO-03, SU-05 | Cubierto como explícito | Asume manual; ver Decisiones abiertas. |
| Zona horaria | RN-GL-01 | Parcial | Offset de entrada cubierto; formato exacto de salida ambiguo (#6). |
| Configuración por entorno | RN-GL-03, RN-CA-04 | N/A | D10: el change no agrega variables. |
| Recordatorios | RN-RE-01..03 | Fuera de alcance | C-12/C-13. |
| Paciente online | RN-RO-01/02 | Fuera de alcance | C-03; la spec lo declara explícitamente. |
| Sillón único | RN-SI-01, RN-SI-03 | Parcial | Un sillón cubierto; "solo activos" ausente (#4). |

### Veredicto

**BLOQUEANTE** — El escenario "Ejemplo documentado funciona" no puede pasar con la fecha publicada (ya en el pasado) y quedan ambigüedades de fecha/reloj y de formato de salida que impiden un pass/fail determinista; el resto son observaciones acotadas.
