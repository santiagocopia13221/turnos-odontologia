# Design

## Context

Repo greenfield: todavía no hay `src/`, solo la KB y `CHANGES.md`. La motivación está en `proposal.md` - Why; los requisitos observables, en `specs/turnos/spec.md`.

Restricciones que moldean el approach:
- **Stack**: Node.js (>=20), **CommonJS**, persistencia en memoria, tests con `node:test` (`[../../../../knowledge-base/02_descripcion_general.md]`). Regla dura **S5**: `require`/`module.exports`, sin `"type": "module"`.
- **Arquitectura** (`[../../../../knowledge-base/08_arquitectura_propuesta.md]`): capas `domain` / `application` / `infrastructure`, puertos y adaptadores, inyección de dependencias; **el dominio es puro** (sin IO, regla **S3**).
- **Config por env** (regla **S2**), pero el dominio no lee env: lo que necesite (p. ej. "ahora") se le **inyecta**.
- C-01 es el primer change: no hay cambios previos que respetar.

## Goals / Non-Goals

**Goals:**
- Un núcleo de dominio puro y testeable que garantice ausencia de solapamientos (profesional, sillón, paciente).
- Duración/fin derivados de la prestación (RN-TU-04/08) y RN-TU-07 con reloj inyectado.
- `crearTurno` con repos y reloj inyectados, independiente del transporte.
- Errores de dominio tipados que C-06 pueda mapear a HTTP.

**Non-Goals:**
- HTTP, router, serialización (C-05/C-06); franjas y bloqueos (C-02); resolución/alta de paciente (C-03); auto-asignación de sillón (C-04); cancelar/reprogramar (C-08/C-09); recordatorios (C-12/C-13).
- Persistencia real, resolución de zona horaria en el dominio, autenticación.

## Decisions

### D1 - CommonJS y scaffolding mínimo
`package.json` sin `"type": "module"`; `require`/`module.exports`; script `"test": "node --test"`. Estructura `src/{domain,application,infrastructure}` + `tests/`.
*Alternativa considerada*: ESM (`"type": "module"`), como decía la guía original de `CHANGES.md` §C-01. **Rechazada** por la regla dura S5; se corrige esa guía en este change.

### D2 - Dominio puro con dependencias inyectadas
`application/turnosService.crearTurno({ pacienteId, profesionalId, sillonId, prestacionId, fechaHoraInicio, canalReserva }, { repos, ahora })`. El service resuelve referencias y llama funciones puras de `domain/reglas.js`. El dominio nunca importa infra (S3).
*Alternativa*: entidad `Turno` con acceso a repos (active record) → **descartada** por acoplar dominio a persistencia.

### D3 - Solapamiento como función pura única
`haySolapamiento(a, b)` compara intervalos semiabiertos; se parametriza por clave. Misma función para las tres reglas (profesional/sillón/paciente).
`solapan(a, b) := a.inicio < b.fin && b.inicio < a.fin`
*Alternativa*: tres implementaciones separadas → **descartada** por duplicación; hay un solo concepto.

### D4 - Cálculo en epoch ms (tz-agnóstico)
La comparación usa `Date.getTime()`. La zona horaria (RN-GL-01) no afecta la aritmética de solapamiento; se resolverá en el borde/franjas (C-02).
*Alternativa*: comparar strings `HH:MM` → **descartada** (falla al cruzar días).

### D5 - Duración derivada de la prestación
`fin = inicio + prestacion.duracionMinutos`. El cliente no envía duración (RN-TU-04). Se valida `duracionMinutos > 0` (RN-PR-03).
*Alternativa*: aceptar duración manual y validarla → **descartada** (rompe RN-TU-04 / regla D2 del proyecto).

### D6 - Reloj inyectado
`ahora()` default `() => new Date()`; los tests inyectan un instante fijo. Habilita RN-TU-07 determinista sin leer env en el dominio.
*Alternativa*: usar `Date.now()` directo → **descartada** (no testeable de forma determinista).

### D7 - Errores de dominio tipados
`class DomainError extends Error` con `code` estable. Códigos: `PROFESIONAL_OCUPADO`, `SILLON_OCUPADO`, `PACIENTE_OCUPADO`, `FECHA_EN_PASADO`, `REFERENCIA_INEXISTENTE`, `DURACION_INVALIDA`. C-06 los mapea a `409`/`422` (Flujo 1).
*Alternativa*: devolver `{ ok, error }` → **descartada** por menos idiomática en JS y más ruidosa; el mapeo por `code` es simple.

### D8 - Reparto de invariantes
`domain/turno.js`: invariantes de un turno (fin derivado, `duracionMinutos > 0`, estado válido). `domain/reglas.js`: invariantes cruzadas (solapamientos). Evita solapar responsabilidades.

### D9 - IDs opacos
`node:crypto.randomUUID()` (RN-GL-02), sin dependencias externas (S1).

### D10 - Cancelados fuera de la validación
La validación filtra `estado !== CANCELADO` (RN-TU-09), aunque cancelar sea C-08: evita un refactor posterior.

### D11 - Referencias válidas
`turnosService` verifica existencia de profesional, sillón, prestación y paciente en los repos antes de aplicar reglas → `REFERENCIA_INEXISTENTE`.

## Risks / Trade-offs

- **[Persistencia en memoria] pierde datos al reiniciar** → aceptado en MVP (DD-01); los repos son puertos, swappables por SQLite (C-16) sin tocar dominio.
- **[Validación de referencias en application]** deja al dominio dependiente de entidades ya resueltas → mitigado: las reglas puras solo ven datos inmutables, cubiertas por tests.
- **[Sin franjas/almuerzo todavía]** permite turnos fuera de horario hasta C-02 → documentado como límite conocido del change.
- **[Solapamiento de paciente más estricto que la KB literal]** ("a la misma hora") → decisión explícita registrada; unificar criterio simplifica y es la recomendación.
- **[`ahora` default usa reloj del sistema]** puede volver un test flaky → los tests siempre inyectan reloj fijo.

## Migration Plan

Greenfield, sin datos previos. Aplicar = crear estructura y archivos, correr `node --test`. Rollback = eliminar los archivos creados; no hay estado que revertir.

## Open Questions

- ¿Estados distintos de `RESERVADO` (p. ej. `COMPLETADO`/`AUSENTE`) deberían bloquear el solapamiento? Hoy solo se crean `RESERVADO`; se define en C-08 cuando existan esos estados.
- Política de asignación de sillón (automática vs manual): fuera de C-01, se resuelve en C-04.
