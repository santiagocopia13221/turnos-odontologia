# Descripción General

## Stack tecnológico

| Capa | Tecnología | Versión mínima | Notas |
|---|---|---|---|
| Runtime | Node.js | >= 20 (LTS) | Sin frameworks pesados |
| Lenguaje | JavaScript (CommonJS) | — | `require` / `module.exports` (ver regla S5) |
| Servidor HTTP | módulo nativo `node:http` | built-in | Sin Express ni dependencias externas |
| Persistencia | En memoria (objetos/Map) | — | Reemplazable por DB luego |
| Tests | `node:test` (+ `node:assert`) | built-in | `node --test` |
| Config | Variables de entorno | — | Ver `08` |

> **Decisión**: se evitan dependencias externas para el MVP (ver DD-02). El foco está en modelar
> las reglas de negocio correctamente y cubrirlas con tests.

## Arquitectura general

Arquitectura por capas, con el dominio aislado de la infraestructura:

```
┌──────────────────────────────────────────────────────────────┐
│  Cliente (a futuro: web/móvil; hoy: curl/tests)                │
└───────────────┬──────────────────────────────────────────────┘
                │ HTTP (JSON)
        ┌───────▼─────────┐
        │ infrastructure/ │  http/server.js  (router nativo)
        │  http · repos   │  repos/inMemoryRepos.js
        │  notificaciones │  notificaciones/whatsappStub.js
        └───────┬─────────┘
                │
        ┌───────▼─────────┐
        │  application/   │  turnosService.js  (casos de uso)
        │                 │  agendaService.js
        └───────┬─────────┘
                │
        ┌───────▼─────────┐
        │     domain/     │  turno.js · disponibilidad.js · reglas.js
        │  (puro, sin IO) │  entidades + reglas de negocio
        └─────────────────┘
```

- **domain/**: entidades y funciones puras (validación de solapamientos, cálculo de fin de turno,
  disponibilidad). Sin acceso a red ni disco → 100% testeable.
- **application/**: orquesta casos de uso usando puertos (repositorios, notificador).
- **infrastructure/**: implementaciones concretas (servidor HTTP, repos en memoria, adapter de
  WhatsApp).

## Integraciones externas

| Servicio | Propósito | Tipo | Estado en MVP |
|---|---|---|---|
| WhatsApp (Meta Cloud API u otro) | Recordatorios de turno | REST (server-side) | **Stub** (`whatsappStub`), sin envío real |

## API REST

Endpoints principales, agrupados por recurso.

**Públicos (paciente, sin login):**

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/health` | Estado del servicio |
| GET | `/prestaciones` | Lista de prestaciones y sus duraciones |
| GET | `/profesionales` | Lista de profesionales activos |
| GET | `/disponibilidad` | Slots libres (`profesionalId`, `prestacionId`, `fecha`) |
| POST | `/turnos` | Reserva online (nombre + teléfono + prestación + profesional + inicio) |
| GET | `/turnos/:id` | Detalle del turno |
| POST | `/turnos/:id/cancelar` | Cancela (valida RN-CA-01) |
| POST | `/turnos/:id/reprogramar` | Reprograma (valida reglas de reserva) |

**Staff (recepción/odontólogo/admin) — auth diferida al MVP:**

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/agenda` | Agenda por fecha, filtrable por profesional y/o sillón |
| POST | `/turnos` (canal interno) | Carga manual de turno |
| PUT | `/turnos/:id` | Edición |
| POST | `/bloqueos` | Crea bloqueo de agenda |
| CRUD | `/pacientes`, `/profesionales`, `/sillones`, `/prestaciones` | Administración |

> Ver contratos y estados de error en `07_flujos_principales.md`.
