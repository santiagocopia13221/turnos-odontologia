# Modelo de Datos

## Dominios

- **Catálogo**: `Profesional`, `Sillon`, `Prestacion` (recursos configurables).
- **Agenda**: `HorarioAtencion`, `BloqueoAgenda`, `Turno`.
- **Personas**: `Paciente`.
- **Notificaciones**: `Recordatorio`.

## ERD (descripción de relaciones)

```
Profesional 1 ──── * HorarioAtencion
Profesional 1 ──── * Turno
Profesional 1 ──── * BloqueoAgenda
Sillon      1 ──── * Turno
Sillon      1 ──── * BloqueoAgenda
Prestacion  1 ──── * Turno
Paciente    1 ──── * Turno
Turno       1 ──── * Recordatorio
```

## Entidades

### Profesional
- `id` (string, PK)
- `nombre` (string)
- `especialidad` (string | null)
- `activo` (boolean, default true)
- Relaciones: tiene * HorarioAtencion, * Turno, * BloqueoAgenda.

### Sillon
- `id` (string, PK)
- `nombre` (string, ej. "Sillón 1")
- `activo` (boolean, default true)
- Relaciones: * Turno, * BloqueoAgenda.

### Prestacion
- `id` (string, PK)
- `nombre` (string, ej. "Consulta", "Limpieza")
- `duracionMinutos` (number, > 0)
- `activo` (boolean, default true)
- Constraints: `duracionMinutos` define la duración del turno (RN-TU-04).
- Relaciones: * Turno.

### Paciente
- `id` (string, PK)
- `nombre` (string)
- `telefono` (string, normalizado E.164 AR, ej. `+54911...`)
- Constraints: `telefono` único (identifica al paciente sin login, RN-RO-01/02).
- Relaciones: * Turno.

### HorarioAtencion
- `id` (string, PK)
- `profesionalId` (FK → Profesional)
- `diaSemana` (0–6)
- `horaInicio` (string "HH:MM")
- `horaFin` (string "HH:MM")
- Constraints: `horaInicio < horaFin`; franjas de un mismo profesional/día no se solapan.

### BloqueoAgenda
- `id` (string, PK)
- `profesionalId` (FK | null)
- `sillonId` (FK | null)
- `fecha` (string "YYYY-MM-DD")
- `horaInicio`, `horaFin` (string "HH:MM")
- `motivo` (string, ej. "Almuerzo")
- Constraints: al menos uno de `profesionalId`/`sillonId` no nulo.

### Turno
- `id` (string, PK)
- `pacienteId` (FK → Paciente)
- `profesionalId` (FK → Profesional)
- `sillonId` (FK → Sillon)
- `prestacionId` (FK → Prestacion)
- `fechaHoraInicio` (ISO 8601 con tz AR)
- `fechaHoraFin` (derivado = inicio + duración de la prestación)
- `estado` (`RESERVADO` | `CANCELADO` | `COMPLETADO` | `AUSENTE`)
- `canalReserva` (`ONLINE` | `RECEPCION`)
- `creadoEn`, `actualizadoEn` (ISO)
- Constraints / índices:
  - Sin solapamiento por `profesionalId` (RN-TU-01).
  - Sin solapamiento por `sillonId` (RN-TU-02).
  - Sin solapamiento por `pacienteId` a la misma hora (RN-TU-03).
  - `fechaHoraInicio` dentro de una franja del profesional (RN-TU-05).
  - No solapar con `BloqueoAgenda` (RN-TU-06).
  - No reservar en el pasado (RN-TU-07).
- Relaciones: * Recordatorio.

### Recordatorio
- `id` (string, PK)
- `turnoId` (FK → Turno)
- `programadoPara` (ISO)
- `enviadoEn` (ISO | null)
- `estado` (`PENDIENTE` | `ENVIADO` | `FALLIDO`)
- `canal` (`WHATSAPP`)

## Seed data inicial

| Entidad | Datos |
|---|---|
| Profesionales | `Dr. Pérez` (Odontología general), `Dra. Gómez` (Endodoncia) |
| Sillones | Sillón 1, Sillón 2, Sillón 3 |
| Prestaciones | Consulta 30 min · Limpieza 40 min · Extracción 45 min · Endodoncia 60 min |
| Franjas (por profesional) | Lun–Vie 09:00–13:00 y 14:00–19:00; bloqueo de almuerzo 13:00–14:00 |
| Pacientes | 2–3 de prueba con teléfono AR |
