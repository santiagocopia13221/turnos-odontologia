# Visión y Objetivos

## Propósito del sistema

API backend para que un consultorio odontológico con varios profesionales y varios sillones
gestione la reserva de turnos, reemplazando la coordinación manual (teléfono / WhatsApp / planilla)
que hoy genera tiempo perdido, falta de visibilidad de la disponibilidad real y riesgo de
solapamientos.

En esta primera versión el sistema es **solo backend** (API REST), sin interfaz gráfica, con
persistencia **en memoria** y una batería de **tests automatizados** que codifican las reglas de
negocio.

## Objetivos por actor

| Actor | Objetivo principal | Objetivos secundarios |
|---|---|---|
| Paciente | Reservar un turno sin llamar ni depender del horario de atención | Cancelar/reprogramar con anticipación; recibir recordatorio |
| Recepcionista | Ver y gestionar la agenda del día sin solapamientos | Cargar turnos manuales; consultar disponibilidad por sillón |
| Odontólogo | Ver su agenda del día | Saber qué paciente tiene y a qué hora |
| Administrador | Configurar profesionales, sillones, prestaciones y franjas | Mantener la agenda coherente |
| Sistema (job) | Enviar recordatorios de turnos próximos | Marcar recordatorios enviados/fallidos |

## Alcance v0.1 (MVP)

- API REST, **sin interfaz gráfica**.
- **Reserva online sin login** (nombre + teléfono del paciente).
- **Cancelación y reprogramación** de turnos, con regla de **24 h** de anticipación mínima.
- **Agenda diaria por profesional y por sillón**.
- **Prevención de solapamiento**: mismo profesional, mismo sillón y mismo paciente.
- **Duración variable por prestación**.
- Franjas de atención y bloqueos (incluye almuerzo).
- Persistencia **en memoria**.
- **Tests automatizados** con el runner nativo de Node (`node:test`).
- Recordatorios: modelo de datos + **adapter de WhatsApp como stub** (sin envío real todavía).

## Fuera de alcance

- Interfaz gráfica (web o móvil).
- Envío **real** de WhatsApp / proveedor de mensajería (queda tras un adapter).
- Facturación, obras sociales y ARCA.
- Historia clínica y odontograma.
- Pagos / señas (MercadoPago u otro).
- Autenticación y autorización efectivas: los **roles se modelan** pero no se enforce en el MVP.
- Multi-sucursal / multi-tenant.
- Base de datos persistente (Postgres u otra).
- Feriados y excepciones de calendario.

## Métricas de éxito

- Las reglas de negocio críticas (RN-TU-01..07) están cubiertas por tests y no permiten
  solapamiento.
- Flujo reservar → consultar → cancelar/reprogramar funciona end-to-end vía API.
- 0 turnos con doble ocupación de profesional o sillón en los datos de prueba.
