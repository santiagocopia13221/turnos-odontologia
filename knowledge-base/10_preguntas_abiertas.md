# Preguntas Abiertas

## Inconsistencias detectadas

### IN-01 — WhatsApp como "imprescindible" vs MVP sin envío real
**Discovery dice**: los recordatorios por WhatsApp son parte del MVP imprescindible.
**Restricción técnica dice**: MVP más simple, sin UI, DB en memoria, sin dependencias.
**Impacto**: si el recordatorio real es bloqueante, el MVP no está "lanzable" sin proveedor.
**Resolución propuesta**: MVP con flujo de recordatorios completo pero adapter **stub** (DD-03);
integrar el proveedor real en la etapa siguiente.

### IN-02 — "Sin login" del paciente vs acceso a "su" turno
**Discovery dice**: paciente sin login (nombre + teléfono).
**Diseño dice**: cancelar/reprogramar por `:id` sin credencial.
**Impacto**: cualquiera con el id podría cancelar turnos ajenos.
**Resolución propuesta**: emitir un **token opaco** al reservar y exigirlo en cancelar/reprogramar.

## Preguntas abiertas (priorizadas)

| Prioridad | Pregunta | Bloquea | Decisor |
|---|---|---|---|
| Alta | ¿La asignación de sillón la hace el sistema (automática) o la recepción (manual)? | US-001 / API de reserva | Product Owner |
| Alta | ¿Se confirma "solo backend, sin UI" o la UI entra más adelante en el mismo scope? | Alcance MVP | Product Owner |
| Alta | ¿Hace falta proteger cancelar/reprogramar con token? | Seguridad mínima | Equipo técnico |
| Media | ¿Proveedor de WhatsApp (Meta Cloud API vs Twilio) y quién paga los mensajes? | Etapa de recordatorios reales | Product Owner |
| Media | ¿Cuándo migrar de memoria a persistencia real (SQLite/Postgres)? | Escalabilidad | Tech Lead |
| Media | ¿Las franjas son por profesional o del consultorio? (SU-01) | Modelo de datos | Product Owner |
| Media | ¿Cómo se manejan feriados y excepciones? | Disponibilidad real | Product Owner |
| Baja | ¿Se contemplará multi-sucursal / multi-tenant a futuro? (SU-04) | Modelo de datos | Product Owner |
| Baja | ¿Política de reintentos para recordatorios fallidos? | Job de recordatorios | Tech Lead |

## Puntos "No evidenciado" de la investigación de mercado (Discovery)

Puntos que el informe `docs/discovery/informe-discovery.md` **no pudo confirmar** abriendo las webs
oficiales. Se listan para validarlos: impactan la paridad de producto y el posicionamiento.

### Funciones / precios no evidenciados en competidores

| Prioridad | Sistema(s) | Punto "No evidenciado" | Por qué importa | Cómo validar |
|---|---|---|---|---|
| Alta | Líderes AR (DentalSaaS, Odonto.ar, DentalSoft, DentalCore) | **Auto-agendado del paciente sin login**: ninguno lo declara explícitamente | Es el diferencial central del proyecto | Demo/registro en cada uno |
| Alta | DentalSaaS, DentalSoft, DentalCore | **Validación real de doble ocupación de sillón/box** (no confirmada en las webs) | Regla "sí o sí" del MVP (RN-SI-02) | Reserva simultánea en demo |
| Alta | DenPro, Bilog, ClinIA/OdontoClinIA, AxisMed, DentalFLOW (AR) | Sistemas locales **no investigados** (URL no abierta) | Posibles competidores directos en AR | Abrir sitios oficiales |
| Media | Livio (AR) | **Cobros/facturación**: No evidenciada | Paridad de admin/facturación | Pedir info comercial |
| Media | DentalCore (AR/LatAm) | Detalle de **recordatorios** de WhatsApp: No evidenciado | Paridad del flujo de recordatorios | Demo |
| Media | Dentiqa (LatAm/AR) | **Auto-agendado (booking)** y detalle de **facturación**: No evidenciados | Paridad agenda + admin | Demo |
| Media | Mi Agenda Dental (MX) | **Auto-agendado del paciente**: No evidenciado | Modelo sillón-first de referencia | Demo |
| Media | Simples Dental (BR) | **Precio** no público en la home (link a `/planos-e-precos`) | Benchmark de precio BR | Visitar `/planos-e-precos` |
| Media | Dentalink (CL/LatAm) | **Precio** no público (cotización) | Benchmark de precio LatAm | Pedir cotización |
| Baja | Curve Dental (US) | **Precio** no público (cotización) | Referente de UX internacional | Pedir cotización |
| Baja | Open Dental (US) | **Precio** no evidenciado en la home (página Order) | Transparencia de precio | Visitar la página Order |

### Sistemas no investigados (URL oficial no abierta en esta sesión)

| Prioridad | Sistemas | Origen |
|---|---|---|
| Alta | Bilog · ClinIA / OdontoClinIA · AxisMed · DentalFLOW | Argentina (competidores locales) |
| Alta | DenPro · SmileSys · OralDrive · EIR DR. · Dentidesk · Dentalware | LatAm (AR/CO/MX/CL) |
| Baja | Dentrix / Dentrix Ascend / EagleSoft · tab32 · Doctolib · Turnito / ReservaSimple / iTurnos | Internacionales / multirrubro |

### Validaciones pendientes (de `docs/discovery/checklist.md`)

- [ ] Doble ocupación de **sillón/box** real (demo de DentalSaaS, DentalCore, DentalSoft).
- [ ] Ventana de cancelación **configurable** y duración por prestación end-to-end.
- [ ] **Facturación ARCA + obras sociales** en producción (DentalCore, DoctorYa).
- [ ] **Auto-agendado sin login** (nombre + teléfono): ninguno lo declara explícitamente.
- [ ] **Precios en ARS** de los que cotizan (DentalSoft >10 prof., Livio, Dentiqa, Dentalink).

## [DISCOVERY] Campos con baja confianza

Ninguno: `problem`, `system_type`, `domain`, `scale`, `stack` y `needs_infra` fueron **confirmados
por el usuario** en el Q&A de arquitectura (no inferidos).
