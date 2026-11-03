# Spec Delta

## Purpose

Definir el contrato HTTP mínimo para crear turnos con referencias explícitas y una descripción OpenAPI navegable, sin depender de la resolución de pacientes, las franjas de agenda ni la asignación automática de sillón.

## ADDED Requirements

### Requirement: Creación de turno por HTTP

El sistema SHALL aceptar `POST /turnos` con un cuerpo JSON que identifique paciente, profesional, sillón, prestación y `fechaHoraInicio`, y SHALL responder `201 Created` con el turno persistido en estado `RESERVADO`, su `id` opaco, referencias, inicio, fin derivado y canal. Las fechas de la respuesta (`fechaHoraInicio`, `fechaHoraFin`) SHALL serializarse como instantes ISO 8601 en UTC con milisegundos y sufijo `Z`, con el formato de `Date.prototype.toISOString()` (por ejemplo `2026-11-10T12:30:00.000Z`); no se emite offset `-03:00` en la salida.

#### Scenario: Reserva exitosa

- **WHEN** el servidor usa un reloj inyectado fijo en `2026-11-03T12:00:00-03:00` y se envía `POST /turnos` con IDs existentes, una prestación de 30 min y `fechaHoraInicio = 2026-11-10T09:00:00-03:00`
- **THEN** responde `201` con `estado = RESERVADO`, `fechaHoraInicio = "2026-11-10T12:00:00.000Z"`, `fechaHoraFin = "2026-11-10T12:30:00.000Z"` y un `id` no vacío

### Requirement: Referencias explícitas de paciente y sillón

El endpoint SHALL exigir `pacienteId` y `sillonId` en el cuerpo; NO DEBE resolver un paciente por teléfono ni elegir un sillón libre por su cuenta.

#### Scenario: Paciente o sillón omitidos

- **WHEN** el cuerpo no incluye `pacienteId` o `sillonId`
- **THEN** responde `400` con código `DATOS_INVALIDOS` y no crea el turno

#### Scenario: Sillón ocupado no se reasigna

- **WHEN** el `sillonId` enviado está ocupado en el intervalo solicitado
- **THEN** responde `409` con código `SILLON_OCUPADO` y no busca otro sillón

### Requirement: Fecha de inicio con offset explícito

El endpoint SHALL aceptar `fechaHoraInicio` como fecha-hora ISO 8601 que incluya offset (`Z` o `±HH:MM`); DEBE rechazar fechas sin offset o no parseables.

#### Scenario: Fecha sin offset

- **WHEN** se envía `fechaHoraInicio = "2026-11-10T10:00:00"` sin offset
- **THEN** responde `400` con código `DATOS_INVALIDOS`

#### Scenario: Fecha inválida

- **WHEN** se envía `fechaHoraInicio = "no-es-una-fecha"`
- **THEN** responde `400` con código `DATOS_INVALIDOS`

### Requirement: Canal de reserva opcional

El endpoint SHALL aceptar `canalReserva` con valores `ONLINE` o `RECEPCION`; si se omite, SHALL usar `ONLINE`.

#### Scenario: Canal por defecto

- **WHEN** el cuerpo no incluye `canalReserva`
- **THEN** el turno creado tiene `canalReserva = ONLINE`

#### Scenario: Canal inválido

- **WHEN** `canalReserva` tiene un valor distinto de `ONLINE` o `RECEPCION`
- **THEN** responde `400` con código `DATOS_INVALIDOS`

### Requirement: Solapamientos como conflicto HTTP

El sistema SHALL traducir los errores de solapamiento del dominio a `409 Conflict`, conservando el código estable del dominio.

#### Scenario: Profesional ocupado

- **WHEN** el profesional ya tiene un turno solapado
- **THEN** responde `409` con código `PROFESIONAL_OCUPADO`

#### Scenario: Sillón ocupado

- **WHEN** el sillón ya tiene un turno solapado
- **THEN** responde `409` con código `SILLON_OCUPADO`

#### Scenario: Paciente ocupado

- **WHEN** el paciente ya tiene un turno solapado
- **THEN** responde `409` con código `PACIENTE_OCUPADO`

### Requirement: Errores semánticos de la reserva

El sistema SHALL traducir `REFERENCIA_INEXISTENTE`, `DURACION_INVALIDA` y `FECHA_EN_PASADO` a `422 Unprocessable Entity`, conservando el código.

#### Scenario: Referencia inexistente

- **WHEN** alguno de los IDs enviados no existe
- **THEN** responde `422` con código `REFERENCIA_INEXISTENTE`

#### Scenario: Fecha en el pasado

- **WHEN** el servidor usa un reloj inyectado fijo en `2026-11-03T12:00:00-03:00` y se envía `fechaHoraInicio = 2026-11-03T11:59:59-03:00`
- **THEN** responde `422` con código `FECHA_EN_PASADO`

#### Scenario: Duración inválida

- **WHEN** la prestación referenciada no tiene una duración mayor que cero
- **THEN** responde `422` con código `DURACION_INVALIDA`

### Requirement: Cuerpo de error uniforme

Todas las respuestas de error del endpoint SHALL incluir un objeto JSON con `error.code` estable y `error.message` legible; el código HTTP NO DEBE reemplazar al código de error.

#### Scenario: Error con código y mensaje

- **WHEN** una solicitud falla por cualquier causa controlada
- **THEN** el cuerpo contiene `error.code` y `error.message`, y `error.code` es distinto según la causa

### Requirement: Datos de entrada inválidos

El endpoint SHALL responder `400 Bad Request` con código `DATOS_INVALIDOS` cuando el cuerpo no sea JSON válido, falte un campo obligatorio, un campo tenga tipo incorrecto o no cumpla el formato esperado.

#### Scenario: JSON malformado

- **WHEN** el cuerpo no es JSON válido
- **THEN** responde `400` con código `DATOS_INVALIDOS`

#### Scenario: Campo obligatorio faltante

- **WHEN** falta `prestacionId` o `fechaHoraInicio`
- **THEN** responde `400` con código `DATOS_INVALIDOS`

### Requirement: Documento OpenAPI publicado

El sistema SHALL servir `GET /openapi.json` con un documento OpenAPI 3.0.3 que describa `POST /turnos`, sus esquemas de entrada y salida y las respuestas `201`, `400`, `409`, `422` y `500`. El ejemplo de request SHALL recalcularse en cada respuesta a partir del reloj inyectado, sin depender de la fecha en que se escribió el documento.

#### Scenario: Descarga del contrato

- **WHEN** se solicita `GET /openapi.json`
- **THEN** responde `200` con `Content-Type` JSON y el documento contiene la operación `post` en `/turnos` con los esquemas y respuestas documentados

### Requirement: Swagger UI navegable

El sistema SHALL servir `GET /docs` como una página HTML que cargue Swagger UI desde una CDN y apunte a `/openapi.json`, sin requerir paquetes npm adicionales.

#### Scenario: Página de documentación

- **WHEN** se solicita `GET /docs`
- **THEN** responde `200` con `Content-Type` HTML y la página referencia Swagger UI y `/openapi.json`

### Requirement: IDs de demostración utilizables

El servidor de demostración SHALL sembrar datos ficticios con IDs estables y SHALL documentarlos en los ejemplos de OpenAPI, de modo que una persona pueda invocar el endpoint sin inspeccionar el código. El ejemplo de `POST /turnos` SHALL usar un `fechaHoraInicio` calculado respecto del reloj del servidor (el día siguiente a las 10:00 con offset `-03:00`), de modo que el ejemplo publicado sea siempre futuro, también con el reloj real.

#### Scenario: Ejemplo documentado funciona

- **WHEN** el servidor usa un reloj inyectado fijo en `2026-11-03T12:00:00-03:00`, se obtiene el ejemplo de `POST /turnos` publicado en `GET /openapi.json` (con `fechaHoraInicio = 2026-11-04T10:00:00-03:00`) y se lo envía tal cual
- **THEN** responde `201` y crea un turno válido con `fechaHoraInicio = "2026-11-04T13:00:00.000Z"`
