# Funcionalidades

Organizadas por **épica** y luego por **historia de usuario** (formato US-NNN).

## Épica 1: Reserva de turnos (paciente)

### US-001 — Reservar un turno online
**Como** paciente
**Quiero** reservar un turno indicando mi nombre y teléfono
**Para** no depender del horario de atención ni llamar.

**Criterios de aceptación**:
- [ ] `POST /turnos` acepta nombre, teléfono, `prestacionId`, `profesionalId` y `fechaHoraInicio`.
- [ ] La duración se deriva de la prestación (RN-TU-04).
- [ ] Se valida solapamiento de profesional, sillón y paciente (RN-TU-01/02/03).
- [ ] Se valida franja de atención (RN-TU-05) y que no sea en el pasado (RN-TU-07).
- [ ] Se reutiliza el paciente si el teléfono ya existe (RN-RO-02).

**Reglas relacionadas**: RN-TU-01, RN-TU-02, RN-TU-03, RN-TU-04, RN-TU-05, RN-TU-07, RN-RO-01, RN-RO-02

### US-002 — Consultar disponibilidad
**Como** paciente
**Quiero** ver los horarios libres de un profesional para una prestación y fecha
**Para** elegir un turno disponible.

**Criterios de aceptación**:
- [ ] `GET /disponibilidad` devuelve slots libres según franjas, prestación y bloqueos.
- [ ] Excluye turnos existentes y bloqueos (RN-TU-06, RN-TU-09).

**Reglas relacionadas**: RN-TU-05, RN-TU-06, RN-TU-08, RN-TU-09

## Épica 2: Cancelación y reprogramación

### US-003 — Cancelar un turno
**Como** paciente
**Quiero** cancelar mi turno con anticipación
**Para** liberar el horario.

**Criterios de aceptación**:
- [ ] `POST /turnos/:id/cancelar` valida ≥ 24 h (RN-CA-01).
- [ ] Cambia el estado a `CANCELADO` y libera la agenda (RN-TU-09).
- [ ] Rechaza con error si el turno no está `RESERVADO` (RN-CA-03).

**Reglas relacionadas**: RN-CA-01, RN-CA-03, RN-TU-09

### US-004 — Reprogramar un turno
**Como** paciente
**Quiero** cambiar mi turno a otro horario
**Para** ajustarlo sin perder la reserva.

**Criterios de aceptación**:
- [ ] `POST /turnos/:id/reprogramar` valida todas las reglas de reserva (RN-CA-02).
- [ ] Actualiza `fechaHoraInicio`/`fechaHoraFin` y reprograma el recordatorio (RN-RE-02).

**Reglas relacionadas**: RN-CA-02, RN-RE-02

## Épica 3: Agenda del consultorio (staff)

### US-005 — Ver agenda diaria
**Como** recepcionista
**Quiero** ver la agenda del día por profesional y por sillón
**Para** gestionar la carga sin solapamientos.

**Criterios de aceptación**:
- [ ] `GET /agenda` filtra por fecha, profesional y/o sillón.
- [ ] Muestra turnos con paciente, prestación, profesional, sillón, inicio y fin.

**Reglas relacionadas**: RN-TU-01, RN-TU-02

### US-006 — Cargar turno manual
**Como** recepcionista
**Quiero** cargar un turno manualmente (paciente que llega o llama)
**Para** ocupar huecos y ordenar la agenda.

**Criterios de aceptación**:
- [ ] `POST /turnos` con `canalReserva: RECEPCION` aplica las mismas reglas de negocio.

**Reglas relacionadas**: RN-TU-01..07

## Épica 4: Recordatorios

### US-007 — Recordar turnos próximos
**Como** sistema
**Quiero** enviar un recordatorio por WhatsApp ~24 h antes
**Para** reducir las inasistencias.

**Criterios de aceptación**:
- [ ] Se genera un `Recordatorio` al reservar y se reprograma al reprogramar (RN-RE-01/02).
- [ ] En el MVP el envío usa el adapter stub y registra estado (RN-RE-03).

**Reglas relacionadas**: RN-RE-01, RN-RE-02, RN-RE-03

## Épica 5: Administración

### US-008 — Configurar catálogo y franjas
**Como** administrador
**Quiero** gestionar profesionales, sillones, prestaciones y franjas
**Para** mantener la agenda coherente.

**Criterios de aceptación**:
- [ ] CRUD de `/profesionales`, `/sillones`, `/prestaciones` y creación de `/bloqueos`.

**Reglas relacionadas**: RN-GL-02
