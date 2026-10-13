# Discovery — Turnos Odontología

**Fecha**: 2026-10-13
**Fuentes**: sin scraping (el usuario no aportó URLs ni docs propios) — Discovery hecho 100% por Q&A.

## 1. Problema que resuelve

Un consultorio odontológico con varios profesionales y varios sillones/boxes
coordina los turnos a mano (teléfono/WhatsApp/planilla). Eso genera tiempo
perdido confirmando turnos, pacientes que no ven la disponibilidad real y riesgo
de solapamientos (dos turnos en el mismo profesional o en el mismo sillón).

## 2. Usuarios / roles

- **Paciente**: reserva un turno online, ve disponibilidad y cancela/reagenda.
- **Recepcionista / administrativo**: gestiona la agenda de todos los
  profesionales y sillones; carga turnos manuales (los que llegan o llaman).
- **Odontólogo / profesional**: entra al sistema para ver su propia agenda del día.

## 3. Casos de uso

1. Como paciente, quiero reservar un turno online para no depender del horario
   de atención ni llamar por teléfono.
2. Como paciente, quiero cancelar o reagendar mi turno (con la anticipación
   mínima requerida) para liberar el horario.
3. Como odontólogo, quiero ver mi agenda del día para saber qué pacientes tengo
   y a qué hora.
4. Como recepcionista, quiero ver la agenda del día por profesional y por sillón
   para gestionar la carga del consultorio.
5. Como recepcionista, quiero cargar un turno manualmente para los pacientes que
   llegan o llaman.

## 4. Competidores / soluciones existentes

Relevados **16 sistemas + adicionales** (Argentina, LatAm e internacional). Hoy el
consultorio resuelve esto con **WhatsApp / teléfono / planilla**.

- **Informe completo** (tabla comparativa, scoring, análisis y recomendación):
  `docs/discovery/informe-discovery.md`
- **Verificación de fuentes**: `docs/discovery/checklist.md`
- **Referencias cercanas (AR)**: DentalSaaS, DentalSoft, DentalCore, Livio, DoctorYa.
- **Benchmark LatAm**: Dentalink (ficha clínica/financiero), Mi Agenda Dental
  (modelo por sillón).
- **Referencias de UX (int.)**: Dentally Portal, Curve Dental.
- **Vacío detectado**: nadie modela el **sillón como ciudadano de primera clase**
  (validación de doble ocupación de box) + reglas de agenda configurables.

## 5. Funcionalidades necesarias

- Reserva de turno online por parte del paciente.
- Cancelación y reprogramación de turnos.
- Datos básicos del paciente (nombre + teléfono, **sin login**).
- Agenda diaria por profesional y por sillón.
- Recordatorios de turno por WhatsApp.

## 6. Funcionalidades opcionales

- Historia clínica / odontograma.
- Pagos online / señas.

## 7. Reglas de negocio

- No se puede cancelar un turno con menos de **24 horas** de anticipación.
- Un profesional no puede tener dos turnos superpuestos.
- Un sillón/box no puede tener dos turnos superpuestos.
- Cada turno tiene **duración variable según la prestación**.
- La agenda respeta franjas horarias de atención por día (bloqueo de almuerzo).
- Un paciente no puede tener dos turnos a la misma hora.

## 8. Integraciones

- **WhatsApp / mensajería** — para los recordatorios de turno (dentro del MVP).

## 9. Restricciones

- Tiene que andar bien en celular (la mayoría de los pacientes reserva desde el
  teléfono).
- Presupuesto acotado.

## 10. Riesgos

- Que la agenda quede desactualizada y aumenten las inasistencias (preocupación
  principal del usuario).
- Asignación de sillón mal modelada → doble ocupación de un box.

**Supuestos sin probar**:
- Que los pacientes adopten la reserva online en vez de seguir llamando.
- Que la recepción mantenga la agenda cargada y al día.

## 11. Preguntas abiertas

- ¿Multi-sucursal a futuro? ¿Modelo multi-tenant desde el día 1?
- ¿Quién define la duración por prestación y dónde se administra?
- ¿La asignación de sillón la hace el sistema (automática) o la recepción (manual)?
- ¿Cómo se manejan feriados y excepciones de agenda?
