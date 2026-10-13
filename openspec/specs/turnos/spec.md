# turnos Specification

## Purpose

Permitir crear turnos garantizando que no se solapen por profesional, sillón ni paciente, con la duración derivada de la prestación. Es el núcleo de agenda que asegura reservas consistentes.

## Requirements

### Requirement: Creación de turno reservado

El sistema SHALL exponer una operación de aplicación para crear un turno que, si tiene éxito, queda persistido en estado `RESERVADO` con un `id` opaco generado por el sistema, las referencias (`profesionalId`, `sillonId`, `prestacionId`, `pacienteId`), `fechaHoraInicio`, `fechaHoraFin` y `canalReserva`.

#### Scenario: Creación exitosa

- **WHEN** se crea un turno con profesional, sillón, prestación, paciente y `fechaHoraInicio` válidos y sin conflictos
- **THEN** se devuelve el turno con `estado = RESERVADO`, un `id` no vacío y su `fechaHoraFin`

### Requirement: Duración derivada de la prestación

El sistema SHALL fijar `fechaHoraFin` como `fechaHoraInicio` más la `duracionMinutos` de la prestación referenciada (RN-TU-04 / RN-PR-01); el cliente NO PUEDE enviar una duración. La prestación referenciada DEBE existir y tener `duracionMinutos > 0` (RN-PR-03).

#### Scenario: Fin derivado

- **WHEN** se crea un turno con una prestación de 30 min que inicia `2026-10-20T09:00:00-03:00`
- **THEN** `fechaHoraFin` es `2026-10-20T09:30:00-03:00`

#### Scenario: Prestación con duración inválida

- **WHEN** la prestación referenciada no existe o tiene `duracionMinutos <= 0`
- **THEN** la creación falla con un error de dominio tipado

### Requirement: Sin solapamiento por profesional

El sistema SHALL rechazar la creación de un turno cuyo intervalo `[fechaHoraInicio, fechaHoraFin)` se solape con otro turno no cancelado del mismo profesional (RN-TU-01).

#### Scenario: Profesional ocupado

- **WHEN** existe un turno `09:00–09:30` del Dr. Pérez y se intenta crear otro `09:15–09:45` del Dr. Pérez
- **THEN** la creación falla con error `PROFESIONAL_OCUPADO`

#### Scenario: Turnos contiguos del mismo profesional

- **WHEN** existe un turno `09:00–09:30` y se crea otro `09:30–10:00` del mismo profesional
- **THEN** la creación es exitosa

### Requirement: Sin solapamiento por sillón

El sistema SHALL rechazar la creación de un turno cuyo intervalo `[fechaHoraInicio, fechaHoraFin)` se solape con otro turno no cancelado asignado al mismo sillón, sin importar el profesional (RN-TU-02 / RN-SI-02).

#### Scenario: Sillón ocupado

- **WHEN** existe un turno en el Sillón 1 `10:00–10:45` y se intenta crear otro en el Sillón 1 `10:30–11:00` con otro profesional
- **THEN** la creación falla con error `SILLON_OCUPADO`

#### Scenario: Sillones distintos en paralelo

- **WHEN** dos turnos en el mismo horario usan sillones distintos
- **THEN** la creación es exitosa

### Requirement: Sin solapamiento por paciente

El sistema SHALL rechazar la creación de un turno cuyo intervalo `[fechaHoraInicio, fechaHoraFin)` se solape con otro turno no cancelado del mismo paciente (RN-TU-03), con el mismo criterio de solapamiento que profesional y sillón.

#### Scenario: Paciente con turnos solapados

- **WHEN** un paciente ya tiene un turno `09:00–09:30` y se intenta crear otro `09:15–09:45` para él (mismo u otro profesional)
- **THEN** la creación falla con error `PACIENTE_OCUPADO`

#### Scenario: Paciente con turnos contiguos

- **WHEN** un paciente tiene `09:00–09:30` y se crea otro `09:30–10:00`
- **THEN** la creación es exitosa

### Requirement: Intervalos semiabiertos

El sistema SHALL evaluar todo solapamiento con intervalos **semiabiertos `[inicio, fin)`** (RN-TU-08): dos turnos que solo se tocan en el borde NO se consideran superpuestos.

#### Scenario: Bordes contiguos no chocan

- **WHEN** un turno termina exactamente cuando otro comienza (`fin == inicio`) para la misma clave (profesional/sillón/paciente)
- **THEN** no hay conflicto

### Requirement: No reservar en el pasado

El sistema SHALL rechazar la creación de un turno cuyo `fechaHoraInicio` sea anterior al instante actual, obtenido de un reloj inyectado (RN-TU-07).

#### Scenario: Fecha en el pasado

- **WHEN** `fechaHoraInicio` es anterior a `ahora`
- **THEN** la creación falla con error `FECHA_EN_PASADO`

#### Scenario: Inicio igual o posterior a ahora

- **WHEN** `fechaHoraInicio` es igual o posterior a `ahora`
- **THEN** la validación de pasado no bloquea la creación

### Requirement: Los turnos cancelados no bloquean

El sistema SHALL excluir los turnos en estado `CANCELADO` al evaluar solapamientos (RN-TU-09).

#### Scenario: Turno cancelado no bloquea

- **WHEN** existe un turno `CANCELADO` `09:00–09:30` para un profesional y se crea otro `09:00–09:30` para el mismo profesional
- **THEN** la creación es exitosa

### Requirement: Referencias válidas

El sistema SHALL rechazar la creación de un turno que referencie un profesional, sillón, prestación o paciente inexistente.

#### Scenario: Referencia inexistente

- **WHEN** se referencia un `sillonId` que no existe
- **THEN** la creación falla con un error de dominio tipado `REFERENCIA_INEXISTENTE`

### Requirement: Errores de dominio tipados

El sistema SHALL señalar las fallas de creación con errores de dominio que expongan un `code` estable y legible por máquina, distinguiendo al menos: profesional ocupado, sillón ocupado, paciente ocupado, fecha en el pasado y referencia inexistente.

#### Scenario: Códigos distinguibles

- **WHEN** ocurren dos fallas distintas (por ejemplo, profesional ocupado y fecha en el pasado)
- **THEN** cada error expone un `code` distinto y estable
