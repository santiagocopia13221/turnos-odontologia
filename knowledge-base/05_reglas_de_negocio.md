# Reglas de Negocio

Cada regla tiene un código único `RN-{DOMINIO}-{NN}` para trazabilidad.

## Dominio: Turnos (RN-TU)

- **RN-TU-01**: Un **profesional** no puede tener dos turnos superpuestos. — Evita doble agenda.
- **RN-TU-02**: Un **sillón/box** no puede tener dos turnos superpuestos. — Evita doble ocupación.
- **RN-TU-03**: Un **paciente** no puede tener dos turnos a la misma hora.
- **RN-TU-04**: La **duración** del turno se deriva de la prestación (`duracionMinutos`); no se
  ingresa a mano.
- **RN-TU-05**: Un turno debe caer **dentro de una franja de atención** del profesional
  (`HorarioAtencion`) para ese día de la semana.
- **RN-TU-06**: Un turno no puede solaparse con un **bloqueo de agenda** del profesional o del
  sillón (ej. almuerzo).
- **RN-TU-07**: No se puede **reservar en el pasado** (`fechaHoraInicio` >= ahora).
- **RN-TU-08**: El **fin** del turno es `inicio + duracionMinutos`. Todo solapamiento se evalúa con
  intervalos semiabiertos `[inicio, fin)`.
- **RN-TU-09**: Un turno `CANCELADO` **libera** la agenda (no participa en validaciones de
  solapamiento ni de disponibilidad).

## Dominio: Prestaciones y duración (RN-PR)

- **RN-PR-01**: Cada **prestación** define su duración en minutos (`duracionMinutos`) y es la
  **fuente de verdad** de la duración del turno (reafirma RN-TU-04).
- **RN-PR-02**: Un turno siempre referencia una **prestación activa** (`Prestacion.activo = true`).
- **RN-PR-03**: `duracionMinutos` debe ser **> 0**; se valida al crear/editar la prestación.

## Dominio: Sillones / boxes (RN-SI)

- **RN-SI-01**: Un turno ocupa **exactamente un sillón** durante toda su duración (ver DD-06).
- **RN-SI-02**: Un **sillón/box** no puede tener dos turnos solapados en el tiempo (reafirma
  RN-TU-02).
- **RN-SI-03**: Solo se asignan **sillones activos** (`Sillon.activo = true`).
- **RN-SI-04**: Un sillón puede tener **bloqueos** (ej. mantenimiento) vía `BloqueoAgenda`
  (RN-TU-06).

## Dominio: Cancelación y reprogramación (RN-CA)

- **RN-CA-01**: No se puede **cancelar** un turno con menos de **24 h** de anticipación.
- **RN-CA-02**: La **reprogramación** debe respetar todas las reglas de reserva (RN-TU-01..09,
  RN-PR-01..02, RN-SI-01..03); es equivalente a cancelar + crear, pero conservando al paciente.
- **RN-CA-03**: Solo se pueden cancelar/reprogramar turnos en estado `RESERVADO`.
- **RN-CA-04**: La ventana mínima de cancelación es **configurable** (por defecto 24 h) vía
  variable de entorno.

## Dominio: Reserva online (RN-RO)

- **RN-RO-01**: El paciente se identifica con **nombre + teléfono**, **sin login**.
- **RN-RO-02**: El teléfono se **normaliza** (E.164 AR); si ya existe un paciente con ese teléfono, se
  reutiliza en vez de crear uno nuevo.
- **RN-RO-03**: La reserva online asigna el **sillón** disponible para el profesional/prestación
  (política de asignación a confirmar — ver 10).

## Dominio: Recordatorios (RN-RE)

- **RN-RE-01**: Se programa un recordatorio ~**24 h antes** del turno.
- **RN-RE-02**: Si el turno se cancela o reprograma, el recordatorio pendiente se **reprograma o
  descarta**.
- **RN-RE-03**: En el MVP el envío es **simulado** (adapter stub); el estado del recordatorio se
  registra igual.

## Dominio: Excepciones globales (RN-GL)

- **RN-GL-01**: Todas las fechas se manejan en zona horaria **America/Argentina/Buenos_Aires**.
- **RN-GL-02**: Los identificadores son **strings opacos** (UUID) generados por el sistema.
- **RN-GL-03**: La configuración (ventana de cancelación, zona horaria) vive en variables de entorno,
  no hardcodeada.
