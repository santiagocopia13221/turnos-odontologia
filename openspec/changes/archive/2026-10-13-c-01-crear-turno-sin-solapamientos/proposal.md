# Propuesta

## Why

El consultorio coordina los turnos a mano (teléfono/planilla), lo que arriesga **doble reserva** del mismo profesional, sillón o paciente. La validación de solapamientos es una regla "sí o sí" del MVP (RN-TU-01/02/03) y, sin un núcleo de dominio que la garantice, ninguna capa superior (API HTTP, agenda) puede prometer turnos consistentes. Este es el **primer change (C-01)** y el cimiento del camino crítico.

## What Changes

- Nuevo **núcleo de dominio puro** (`src/domain/`, sin IO) con las entidades `Turno`, `Profesional`, `Sillon`, `Prestacion` y `Paciente`.
- **Duración derivada** de la prestación (RN-TU-04/RN-PR-01) y **fin** = inicio + duración, con intervalos **semiabiertos `[inicio, fin)`** (RN-TU-08).
- **Reglas de solapamiento** puras por profesional (RN-TU-01), sillón (RN-TU-02) y paciente (RN-TU-03).
- **RN-TU-07** (no reservar en el pasado) con un **reloj inyectado** para ser testeable.
- **Errores de dominio tipados** con `code` (ej. `PROFESIONAL_OCUPADO`), mapeables a HTTP en changes posteriores.
- `application/turnosService.crearTurno()` con **repositorios inyectados** (DD-01) + repositorios **in-memory** + **seed mínimo**.
- Scaffolding mínimo del proyecto: `package.json` en **CommonJS** (`require`/`module.exports`) y script `test` con `node --test`.

**No incluye** (queda para changes posteriores): HTTP/router (C-05/C-06), franjas y bloqueos (C-02), resolución de paciente (C-03), **auto-asignación de sillón** (C-04), cancelar/reprogramar (C-08/C-09), recordatorios (C-12/C-13).

Sin cambios disruptivos (**BREAKING**): none.

## Capabilities

### New Capabilities
- `turnos`: creación de un turno con validación de solapamientos (profesional, sillón, paciente), duración derivada de la prestación, fin en intervalos semiabiertos y alta del turno en estado `RESERVADO`.

### Modified Capabilities
- (ninguna)

## Impact

- **Nuevos archivos**: `src/domain/`, `src/application/`, `src/infrastructure/repos/`, `test/`, `package.json`.
- **Dependencias**: ninguna externa; solo módulos nativos (`node:crypto`, `node:test`, `node:assert`).
- **Desbloquea**: C-02, C-03, C-04 y C-05 (una vez archivado C-01).
- **Consistencia de repo**: corrige la guía de scaffolding de `CHANGES.md` §C-01 (ESM → **CommonJS**, alineado con la regla dura **S5**).

## Supuestos registrados (decisiones tomadas acá)

- **RN-TU-03** se valida como **overlap unificado** (mismo criterio que profesional/sillón), no solo "misma hora de inicio".
- **RN-TU-07** entra en C-01 (es del núcleo de creación) con `ahora` inyectado.
- El **dominio no resuelve zona horaria ni IO**: el solapamiento se compara por *epoch ms*; la tz (RN-GL-01) se resuelve en el borde/franjas (C-02).
- `crearTurno` **recibe `sillonId` explícito**: es agnóstico a la política de asignación automática/manual (pregunta abierta Alta), que se resuelve en C-04.
- La validación de solapamiento **ignora turnos `CANCELADO`** desde ya (RN-TU-09, defensivo).
- `id` de entidades vía `node:crypto.randomUUID()` (RN-GL-02, sin dependencias).

Elegimos este change porque pertenece al MVP del Discovery, tiene reglas verificables y es lo bastante chico para terminarse.
