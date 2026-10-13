# CHANGES — Secuencia de Implementación

> Índice canónico de todos los changes del proyecto **turnos-odontologia**.
> Cada change es atómico: un agente puede implementarlo en una sesión (~4-6 horas).
> **Leer este archivo antes de ejecutar cualquier `/opsx:propose`.**

---

## Cómo usar este documento

1. Identificar el change a implementar (verificar que sus dependencias están en `openspec/changes/archive/`).
2. Leer los docs de la knowledge-base indicados en "Leer antes".
3. Ejecutar `/opsx:propose <nombre-del-change>`.
4. Al terminar el change, archivarlo con `/opsx:archive <nombre-del-change>`.
5. Marcar el checkbox `[x]` en este archivo.

---

## Árbol de dependencias

```
C-01 crear-turno-sin-solapamientos              ← PRIMER CHANGE (dominio, sin HTTP)
  ├── C-02 franjas-y-bloqueos-agenda
  │     └── C-04 asignacion-de-sillon
  │           └── C-06 endpoint-crear-turno ─────┬── C-08 cancelar-turno
  │                                              │     └── C-09 reprogramar-turno ─┐
  │                                              └── C-12 recordatorios-modelo     │
  │                                                    └── C-13 recordatorios-job-stub ─┐
  ├── C-03 pacientes-sin-login  ──┐                                                   │
  │                               ├── C-06 endpoint-crear-turno                       │
  └── C-05 servidor-http-y-router ┤                                                   │
        ├── C-06 endpoint-crear-turno                                                 │
        ├── C-07 endpoints-consulta-y-disponibilidad                                  │
        │     └── C-10 agenda-diaria                                                  │
        └── C-11 admin-catalogo-y-bloqueos                                            │
                                                                                      │
POST-MVP (fuera del primer tramo): C-09 + C-13 ✓ ─────────────────────────────────────┘
  ├── C-14 whatsapp-real
  ├── C-15 auth-y-rbac
  ├── C-16 persistencia-sqlite
  ├── C-17 pagos-online
  └── C-18 historia-clinica-y-odontograma
```

### Paralelismo por fase

> Cada "gate" es un punto de sincronización. Los changes dentro de un grupo pueden ejecutarse en paralelo.

```
GATE 0: ninguna
  → C-01 crear-turno-sin-solapamientos   (solo)

GATE 1: C-01 ✓                            ← PRIMER FORK (3 paralelos)
  → C-02 franjas-y-bloqueos-agenda       [Agente A]
  → C-03 pacientes-sin-login             [Agente B]
  → C-05 servidor-http-y-router          [Agente C]

GATE 2: C-05 ✓
  → C-07 endpoints-consulta              [Agente C]
  → C-11 admin-catalogo-y-bloqueos       [Agente B]

GATE 3: C-02 ✓
  → C-04 asignacion-de-sillon            [Agente A]

GATE 4: C-03 + C-04 + C-05 ✓
  → C-06 endpoint-crear-turno            [Agente A]

GATE 5: C-06 ✓
  → C-08 cancelar-turno                  [Agente A]
  → C-12 recordatorios-modelo            [Agente B]

GATE 6: C-08 ✓
  → C-09 reprogramar-turno               [Agente A]

GATE 7: C-07 ✓
  → C-10 agenda-diaria                   [Agente C]

GATE 8: C-12 ✓
  → C-13 recordatorios-job-stub          [Agente B]

GATE 9 (POST-MVP): C-09 + C-13 ✓          ← integraciones y capacidades diferidas
  → C-14 whatsapp-real / C-15 auth-y-rbac / C-16 persistencia-sqlite / C-17 pagos-online / C-18 historia-clinica
```

### Camino crítico (6 changes — mínimo irreducible del MVP)

```
C-01 → C-02 → C-04 → C-06 → C-08 → C-09
                              │
                    C-12 → C-13 *
```

\* La rama de recordatorios (`C-12 → C-13`) es casi-crítica: no bloquea `C-09`, pero el MVP no está "lanzable" sin recordatorios (stub).

### Plan óptimo con 3 agentes

```
Paso │ Agente A (Dominio Core)     │ Agente B (Datos y Catálogo)  │ Agente C (API HTTP)
─────┼────────────────────────────┼─────────────────────────────┼────────────────────────────
  1  │ C-01 crear-turno-sin-solap.│             —               │            —
  2  │ C-02 franjas-y-bloqueos    │ C-03 pacientes-sin-login    │ C-05 servidor-y-router
  3  │ C-04 asignacion-de-sillon  │ C-11 admin-catalogo         │ C-07 endpoints-consulta
  4  │ C-06 endpoint-crear-turno  │             —               │            —
  5  │ C-08 cancelar-turno        │ C-12 recordatorios-modelo   │ C-10 agenda-diaria
  6  │ C-09 reprogramar-turno     │ C-13 recordatorios-job-stub │            —
```

---

## FASE 0 — Dominio núcleo

> El dominio es puro (`domain/*`, sin IO) y se construye antes que la API (dominio → API → jobs → integraciones).

### [C-01] `crear-turno-sin-solapamientos`
- **Estado**: `[ ]` pendiente
- **Scope**: Núcleo mínimo del dominio: crear un turno validando solapamientos. Sin HTTP.
  - Scaffolding mínimo: `package.json` (`"type": "module"`), estructura `src/domain`, `src/application`, `src/infrastructure`, `test/`
  - Entidades: `Profesional`, `Sillon`, `Prestacion` (con `duracionMinutos > 0`), `Paciente`, `Turno`
  - `Turno`: `id` (UUID opaco), `pacienteId`, `profesionalId`, `sillonId`, `prestacionId`, `fechaHoraInicio`, `fechaHoraFin` (derivado), `estado`, `canalReserva`
  - `domain/reglas.js` (funciones puras): solapamiento por profesional (RN-TU-01), por sillón (RN-TU-02), por paciente (RN-TU-03), duración derivada de prestación (RN-TU-04), fin = inicio + duración con intervalos semiabiertos `[inicio, fin)` (RN-TU-08)
  - `application/turnosService.crearTurno()` recibe repos inyectados
  - `infrastructure/repos/inMemoryRepos.js`: `ProfesionalRepo`, `SillonRepo`, `PrestacionRepo`, `PacienteRepo`, `TurnoRepo`
  - Seed mínimo: 2 profesionales, 3 sillones, 4 prestaciones (ver 04 §Seed data)
  - Tests: `test/reglas.test.js` — casos límite de solapamiento (borde `[inicio, fin)`), duración derivada, creación OK; `test/turnos.test.js` — crearTurno feliz + rechazos por profesional/sillón/paciente ocupado
- **Dependencias**: ninguna
- **Governance**: CRITICO
- **Leer antes**:
  - `knowledge-base/04_modelo_de_datos.md` §Turno, §Entidades
  - `knowledge-base/05_reglas_de_negocio.md` §Turnos (RN-TU-01/02/03/04/08)
  - `knowledge-base/06_funcionalidades.md` §US-001
  - `knowledge-base/07_flujos_principales.md` §Flujo 1
  - `knowledge-base/08_arquitectura_propuesta.md` §Patrones, §Estructura de directorios

---

## FASE 1 — Reglas de agenda, pacientes y disponibilidad

> C-02, C-03 y C-05 pueden proponerse en paralelo una vez archivado C-01. C-04 depende de C-02.

### [C-02] `franjas-y-bloqueos-agenda`
- **Estado**: `[ ]` pendiente
- **Scope**: Franjas de atención y bloqueos + cálculo de disponibilidad.
  - Entidades: `HorarioAtencion` (`profesionalId`, `diaSemana`, `horaInicio`, `horaFin`), `BloqueoAgenda` (`profesionalId | sillónId`, `fecha`, `horaInicio`, `horaFin`, `motivo`)
  - `domain/disponibilidad.js`: calcula slots libres = franjas − turnos (`RESERVADO`/`COMPLETADO`) − bloqueos, con intervalos semiabiertos
  - Reglas: turno dentro de franja (RN-TU-05), sin solape con bloqueo (RN-TU-06), `CANCELADO` libera agenda (RN-TU-09); validación `horaInicio < horaFin` y franjas no solapadas
  - Tests: `test/agenda.test.js` — disponibilidad con almuerzo 13:00–14:00, exclusión de turnos/bloqueos, borde de franja
- **Dependencias**: C-01
- **Governance**: MEDIO
- **Leer antes**:
  - `knowledge-base/04_modelo_de_datos.md` §HorarioAtencion, §BloqueoAgenda
  - `knowledge-base/05_reglas_de_negocio.md` §Turnos (RN-TU-05/06/09)
  - `knowledge-base/07_flujos_principales.md` §Flujo 1, §Flujo 4
  - `knowledge-base/06_funcionalidades.md` §US-002

### [C-03] `pacientes-sin-login`
- **Estado**: `[ ]` pendiente
- **Scope**: Identificación del paciente por nombre + teléfono, sin login.
  - `application/pacientesService`: normaliza teléfono a E.164 AR (`+54911...`) y resuelve/crea `Paciente` (RN-RO-01, RN-RO-02)
  - Reutilización por teléfono único; validación de formato de teléfono
  - Integración del `pacienteId` resuelto en `crearTurno`
  - Tests: normalización de variantes AR, reutilización de paciente existente, teléfono inválido
- **Dependencias**: C-01
- **Governance**: MEDIO
- **Leer antes**:
  - `knowledge-base/04_modelo_de_datos.md` §Paciente
  - `knowledge-base/05_reglas_de_negocio.md` §Reserva online (RN-RO-01/02)
  - `knowledge-base/03_actores_y_roles.md` §Actores del sistema
  - `knowledge-base/07_flujos_principales.md` §Flujo 1

### [C-05] `servidor-http-y-router`
- **Estado**: `[ ]` pendiente
- **Scope**: Infraestructura HTTP nativa y arranque.
  - `infrastructure/http/server.js`: `node:http` + router por método/ruta, parseo/serialización JSON, manejo central de errores (`400`/`404`/`409`/`422`), CORS mínimo de desarrollo
  - `src/index.js`: lee env (`PORT`, `TZ`) y levanta el server; wiring de repos in-memory + servicios
  - `GET /health` → `200 { status: "ok" }`
  - Catálogo de códigos de error por dominio: `PROFESIONAL_OCUPADO`, `SILLON_OCUPADO`, `PACIENTE_OCUPADO`, `FUERA_DE_FRANJA`, `FECHA_EN_PASADO`
  - Tests: smoke del server (health, 404, JSON malformado)
- **Dependencias**: C-01
- **Governance**: BAJO
- **Leer antes**:
  - `knowledge-base/02_descripcion_general.md` §Arquitectura general, §API REST
  - `knowledge-base/08_arquitectura_propuesta.md` §Estructura de directorios, §Variables de entorno
  - `knowledge-base/07_flujos_principales.md` §Casos de error
  - `knowledge-base/03_actores_y_roles.md` §Rutas públicas

---

## FASE 2 — API de reserva y consulta

### [C-04] `asignacion-de-sillon`
- **Estado**: `[ ]` pendiente
- **Scope**: Política de asignación automática de sillón libre (RN-RO-03, RN-SI-01..03).
  - `domain/`/`application`: elige un `Sillon.activo` libre para el intervalo del turno
  - Reglas: solo sillones activos (RN-SI-03), un turno ocupa exactamente un sillón (RN-SI-01), sin solape (RN-SI-02)
  - Manejo de "sin sillón disponible" → error de dominio
  - Tests: asignación determinística, no asigna sillón ocupado/bloqueado, sin disponibilidad
- **Dependencias**: C-01, C-02
- **Governance**: MEDIO
- **Leer antes**:
  - `knowledge-base/04_modelo_de_datos.md` §Sillon, §Turno
  - `knowledge-base/05_reglas_de_negocio.md` §Sillones (RN-SI-01..03), §Reserva online (RN-RO-03)
  - `knowledge-base/09_decisiones_y_supuestos.md` §DD-06, §SU-05
  - `knowledge-base/10_preguntas_abiertas.md` (asignación de sillón — pregunta Alta)

### [C-06] `endpoint-crear-turno`
- **Estado**: `[ ]` pendiente
- **Scope**: Exponer la creación de turnos por HTTP (online y recepción).
  - `POST /turnos` — acepta `nombre`, `telefono`, `prestacionId`, `profesionalId`, `fechaHoraInicio`, `canalReserva`
  - Flujo: resuelve paciente (C-03) → valida reglas (C-01/C-02) → asigna sillón (C-04) → persiste `RESERVADO` → `201 { turno }`
  - Canal `RECEPCION` (US-006) usando el mismo endpoint y reglas
  - Errores: `409` solapamiento, `422` fuera de franja / fecha en pasado / sin sillón, `400` datos inválidos
  - Tests: reserva online E2E, carga manual, cada error de negocio con su código
- **Dependencias**: C-05, C-03, C-04
- **Governance**: MEDIO
- **Leer antes**:
  - `knowledge-base/02_descripcion_general.md` §API REST
  - `knowledge-base/06_funcionalidades.md` §US-001, §US-006
  - `knowledge-base/07_flujos_principales.md` §Flujo 1
  - `knowledge-base/05_reglas_de_negocio.md` §Turnos, §Reserva online

### [C-07] `endpoints-consulta-y-disponibilidad`
- **Estado**: `[ ]` pendiente
- **Scope**: Endpoints públicos de lectura.
  - `GET /disponibilidad?profesionalId=&prestacionId=&fecha` → slots libres (C-02), excluye turnos y bloqueos (RN-TU-06/09)
  - `GET /prestaciones` → prestaciones activas y duraciones
  - `GET /profesionales` → profesionales activos
  - `GET /turnos/:id` → detalle del turno; `404` si no existe
  - Tests: disponibilidad con/sin filtros, turno inexistente, listado de catálogo
- **Dependencias**: C-05, C-02
- **Governance**: BAJO
- **Leer antes**:
  - `knowledge-base/02_descripcion_general.md` §API REST
  - `knowledge-base/06_funcionalidades.md` §US-002
  - `knowledge-base/07_flujos_principales.md` §Flujo 1
  - `knowledge-base/04_modelo_de_datos.md` §Prestacion

### [C-11] `admin-catalogo-y-bloqueos`
- **Estado**: `[ ]` pendiente
- **Scope**: Administración del catálogo y bloqueos de agenda (US-008).
  - CRUD `POST/GET/PUT/DELETE` para `/profesionales`, `/sillones`, `/prestaciones`
  - `POST /bloqueos` — crea `BloqueoAgenda` de profesional/sillón; `GET/DELETE /bloqueos`
  - Validación: `duracionMinutos > 0` (RN-PR-03), prestación activa (RN-PR-02), al menos un destinatario en el bloqueo
  - Tests: CRUD catálogo, validaciones, creación de bloqueo y su efecto en disponibilidad
- **Dependencias**: C-05, C-03
- **Governance**: BAJO
- **Leer antes**:
  - `knowledge-base/06_funcionalidades.md` §US-008
  - `knowledge-base/02_descripcion_general.md` §API REST (staff)
  - `knowledge-base/04_modelo_de_datos.md` §Entidades
  - `knowledge-base/05_reglas_de_negocio.md` §Prestaciones (RN-PR-02/03)

---

## FASE 3 — Ciclo de vida del turno

### [C-08] `cancelar-turno`
- **Estado**: `[ ]` pendiente
- **Scope**: Cancelación con ventana mínima configurable.
  - `POST /turnos/:id/cancelar`
  - Validaciones: turno `RESERVADO` (RN-CA-03), anticipación ≥ `CANCELACION_MIN_HORAS` (RN-CA-01/04)
  - Marca `CANCELADO` y libera la agenda (RN-TU-09)
  - Errores: `404` inexistente, `409` estado inválido, `422 CANCELACION_FUERA_DE_PLAZO`
  - Tests: cancelación dentro/fuera de plazo, doble cancelación, turno inexistente, liberación de slot
- **Dependencias**: C-06
- **Governance**: MEDIO
- **Leer antes**:
  - `knowledge-base/06_funcionalidades.md` §US-003
  - `knowledge-base/07_flujos_principales.md` §Flujo 2
  - `knowledge-base/05_reglas_de_negocio.md` §Cancelación (RN-CA-01/03/04), §Turnos (RN-TU-09)

### [C-09] `reprogramar-turno`
- **Estado**: `[ ]` pendiente
- **Scope**: Reprogramación reutilizando las reglas de reserva.
  - `POST /turnos/:id/reprogramar` con nuevo `fechaHoraInicio` (y opcional `profesionalId`)
  - Revalida todas las reglas de reserva ignorando el propio turno (RN-CA-02: RN-TU-01..09, RN-SI)
  - Actualiza inicio/fin; conserva al paciente
  - Errores: mismos que la reserva (solapamiento/franja/pasado)
  - Tests: reprogramación válida, rechazo por solapamiento, no colisiona consigo mismo
- **Dependencias**: C-06, C-08
- **Governance**: MEDIO
- **Leer antes**:
  - `knowledge-base/06_funcionalidades.md` §US-004
  - `knowledge-base/07_flujos_principales.md` §Flujo 3
  - `knowledge-base/05_reglas_de_negocio.md` §Cancelación (RN-CA-02)

### [C-10] `agenda-diaria`
- **Estado**: `[ ]` pendiente
- **Scope**: Vista de agenda del día para staff.
  - `GET /agenda?fecha=YYYY-MM-DD[&profesionalId=][&sillonId=]`
  - Lista turnos `RESERVADO`/`COMPLETADO` de la fecha con relaciones resueltas (paciente, prestación, profesional, sillón, inicio, fin)
  - Errores: `400` fecha inválida
  - Tests: filtro por fecha/profesional/sillón, exclusión de cancelados, fecha inválida
- **Dependencias**: C-07
- **Governance**: BAJO
- **Leer antes**:
  - `knowledge-base/06_funcionalidades.md` §US-005
  - `knowledge-base/07_flujos_principales.md` §Flujo 4
  - `knowledge-base/04_modelo_de_datos.md` §Turno
  - `knowledge-base/03_actores_y_roles.md` §RBAC

---

## FASE 4 — Recordatorios (modelo + job stub)

> El puerto `Notificador` con adapter `whatsappStub` es el flujo completo del MVP, sin proveedor real.

### [C-12] `recordatorios-modelo`
- **Estado**: `[ ]` pendiente
- **Scope**: Modelo y ciclo de vida del recordatorio.
  - Entidad `Recordatorio`: `turnoId`, `programadoPara`, `enviadoEn`, `estado` (`PENDIENTE`/`ENVIADO`/`FALLIDO`), `canal` (`WHATSAPP`)
  - Al reservar: crea `Recordatorio` `PENDIENTE` a `inicio − RECORDATORIO_HORAS_ANTES` (RN-RE-01)
  - Al cancelar: descarta el pendiente; al reprogramar: lo reprograma (RN-RE-02)
  - `RecordatorioRepo` in-memory; puerto `Notificador` definido (interfaz)
  - Tests: creación al reservar, descarte al cancelar, reprogramación al reprogramar
- **Dependencias**: C-06, C-08
- **Governance**: MEDIO
- **Leer antes**:
  - `knowledge-base/04_modelo_de_datos.md` §Recordatorio
  - `knowledge-base/05_reglas_de_negocio.md` §Recordatorios (RN-RE-01/02)
  - `knowledge-base/07_flujos_principales.md` §Flujo 5
  - `knowledge-base/09_decisiones_y_supuestos.md` §DD-03

### [C-13] `recordatorios-job-stub`
- **Estado**: `[ ]` pendiente
- **Scope**: Job periódico de envío con adapter stub.
  - `infrastructure/notificaciones/whatsappStub.js` implementa el puerto `Notificador` (no envía de verdad)
  - Job (loop/cron): busca `Recordatorio` `PENDIENTE` con `programadoPara <= ahora`, llama al `Notificador`, marca `ENVIADO`/`FALLIDO` (RN-RE-03)
  - Saltea y descarta recordatorios de turnos cancelados (RN-RE-02)
  - Config: `WHATSAPP_PROVIDER=stub`, `RECORDATORIO_HORAS_ANTES`
  - Tests: job envía pendientes vencidos, marca estado, saltea cancelados
- **Dependencias**: C-12
- **Governance**: MEDIO
- **Leer antes**:
  - `knowledge-base/05_reglas_de_negocio.md` §Recordatorios (RN-RE-03)
  - `knowledge-base/07_flujos_principales.md` §Flujo 5
  - `knowledge-base/08_arquitectura_propuesta.md` §Variables de entorno
  - `knowledge-base/09_decisiones_y_supuestos.md` §DD-03
  - `knowledge-base/10_preguntas_abiertas.md` §IN-01

---

## FASE 5 — POST-MVP (fuera del primer tramo)

> Capacidades deliberadamente diferidas. No arrancar hasta cerrar el MVP (C-01..C-13).

### [C-14] `whatsapp-real`
- **Estado**: `[ ]` pendiente
- **Scope**: Adapter real del puerto `Notificador` (Meta Cloud API o Twilio).
  - `infrastructure/notificaciones/whatsappProvider.js` con credenciales por env (`WHATSAPP_TOKEN`, `WHATSAPP_PHONE_ID`)
  - Selección de adapter por `WHATSAPP_PROVIDER`; política de reintentos y estados de error
  - Tests: contrato del puerto, manejo de fallos del proveedor (mock)
- **Dependencias**: C-13
- **Governance**: ALTO
- **Leer antes**:
  - `knowledge-base/05_reglas_de_negocio.md` §Recordatorios
  - `knowledge-base/08_arquitectura_propuesta.md` §Integraciones externas, §Variables de entorno
  - `knowledge-base/09_decisiones_y_supuestos.md` §DD-03
  - `knowledge-base/10_preguntas_abiertas.md` §IN-01 (proveedor)

### [C-15] `auth-y-rbac`
- **Estado**: `[ ]` pendiente
- **Scope**: Autenticación y autorización efectivas.
  - Token/API key para staff; contrato de acceso del paciente a "su" turno (token opaco al reservar)
  - Enforce de la matriz RBAC de `03`; proteger endpoints de staff
  - Tests: acceso autorizado/denegado por rol, token inválido/expirado
- **Dependencias**: C-06, C-08, C-09
- **Governance**: CRITICO
- **Leer antes**:
  - `knowledge-base/03_actores_y_roles.md` §RBAC, §Rutas públicas
  - `knowledge-base/08_arquitectura_propuesta.md` §Seguridad
  - `knowledge-base/09_decisiones_y_supuestos.md` §DD-04
  - `knowledge-base/10_preguntas_abiertas.md` §IN-02

### [C-16] `persistencia-sqlite`
- **Estado**: `[ ]` pendiente
- **Scope**: Migrar de repos en memoria a persistencia real (SQLite/Postgres).
  - Nuevos adapters de repositorio detrás de los mismos puertos; `schema` inicial + seed
  - Sin cambios en dominio ni application (validación del diseño hexagonal)
  - Tests: paridad de comportamiento memoria ↔ persistente
- **Dependencias**: C-06, C-08, C-09, C-12
- **Governance**: ALTO
- **Leer antes**:
  - `knowledge-base/08_arquitectura_propuesta.md` §Patrones (puertos y adaptadores)
  - `knowledge-base/09_decisiones_y_supuestos.md` §DD-02
  - `knowledge-base/02_descripcion_general.md` §Stack tecnológico
  - `knowledge-base/04_modelo_de_datos.md` §ERD

### [C-17] `pagos-online`
- **Estado**: `[ ]` pendiente
- **Scope**: Señas / pagos online (MercadoPago u otro).
  - Entidad de pago ligada al turno; integración con proveedor; webhook de confirmación
  - Tests: pago aprobado/rechazado, webhook idempotente
- **Dependencias**: C-06, C-15
- **Governance**: CRITICO
- **Leer antes**:
  - `knowledge-base/01_vision_y_objetivos.md` §Fuera de alcance
  - `knowledge-base/08_arquitectura_propuesta.md` §Integraciones externas
  - `knowledge-base/09_decisiones_y_supuestos.md`
  - `knowledge-base/10_preguntas_abiertas.md`

### [C-18] `historia-clinica-y-odontograma`
- **Estado**: `[ ]` pendiente
- **Scope**: Historia clínica del paciente y odontograma.
  - Entidades de historia clínica/odontograma ligadas al `Paciente`; endpoints de staff
  - Tests: CRUD de historia clínica
- **Dependencias**: C-15
- **Governance**: ALTO
- **Leer antes**:
  - `knowledge-base/01_vision_y_objetivos.md` §Fuera de alcance
  - `knowledge-base/04_modelo_de_datos.md` §Paciente
  - `knowledge-base/03_actores_y_roles.md` §RBAC
  - `knowledge-base/10_preguntas_abiertas.md`
