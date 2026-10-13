# Actores y Roles

## Actores del sistema

| Actor | Descripción | Cómo interactúa |
|---|---|---|
| Paciente | Persona que reserva un turno. **No tiene cuenta ni login.** | Vía endpoint público con nombre + teléfono |
| Recepcionista | Administra la agenda del consultorio. | Endpoints de staff (carga, edición, agenda) |
| Odontólogo (Profesional) | Atiende turnos y consulta su agenda. | Endpoints de staff (lectura de su agenda) |
| Administrador | Configura profesionales, sillones, prestaciones y franjas. | Endpoints de administración |
| Sistema (job) | Envío de recordatorios de turnos próximos. | Proceso interno/​cron que invoca el adapter de WhatsApp |

> **Nota MVP**: el sistema es solo backend y **no enforce identidad** todavía. Los roles se modelan
> para habilitar la autorización en una etapa posterior (ver DD-04 y la pregunta abierta de auth).

## RBAC — Matriz de permisos

`C`=crear, `R`=leer, `U`=actualizar, `D`=borrar, `—`=sin acceso.

| Rol \ Recurso | Turno | Agenda | Paciente | Profesional | Sillón | Prestación | Bloqueo |
|---|---|---|---|---|---|---|---|
| Paciente (público) | C, R(propio), U(reprogramar) | — | C(propio, mín.) | — | — | R | — |
| Recepcionista | CRUD | R | CRUD | R | R | R | CRUD |
| Odontólogo | R(propios) | R(propia) | R | R(propio) | R | R | R |
| Administrador | CRUD | R | CRUD | CRUD | CRUD | CRUD | CRUD |
| Sistema (job) | R | — | — | — | — | R | — |

> En el MVP ninguna de estas restricciones se aplica por autenticación; están documentadas como
> contrato objetivo.

## Rutas públicas

Accesibles sin autenticación (paciente):

- `GET /health`
- `GET /prestaciones`
- `GET /profesionales`
- `GET /disponibilidad`
- `POST /turnos` (canal online)
- `GET /turnos/:id`
- `POST /turnos/:id/cancelar`
- `POST /turnos/:id/reprogramar`

> El acceso del paciente a "su" turno se hará con un **token/identificador** devuelto al reservar
> (a definir en auth); en el MVP, el `:id` es suficiente (ver 10).
