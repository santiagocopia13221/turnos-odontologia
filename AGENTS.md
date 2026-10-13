# turnos-odontologia — Instrucciones para Agentes

> Este archivo (y su copia `CLAUDE.md`) es lo PRIMERO que todo agente lee al entrar al repo.
> Generado a partir de `knowledge-base/` y `CHANGES.md`. No editar a mano sin re-sincronizar ambos archivos.

---

## Stack Tecnológico

| Capa | Tecnología | Versión mínima |
|------|------------|----------------|
| Runtime | Node.js | >= 20 (LTS) |
| Lenguaje | JavaScript (**CommonJS**: `require` / `module.exports`) | — |
| Servidor HTTP | módulo nativo `node:http` | built-in |
| Persistencia | En memoria (MVP) | — |
| Tests | `node:test` + `node:assert` | built-in |
| Config | Variables de entorno | — |
| Integraciones | WhatsApp (adapter **stub** en el MVP) | — |

Detalle completo: [knowledge-base/02_descripcion_general.md](knowledge-base/02_descripcion_general.md)

---

## Base de Conocimiento

La fuente de verdad del dominio vive en `knowledge-base/`. **Leé el archivo relevante ANTES de implementar.**

| Archivo | Cuándo leerlo |
|---------|---------------|
| [01_vision_y_objetivos.md](knowledge-base/01_vision_y_objetivos.md) | Entender propósito y alcance |
| [03_actores_y_roles.md](knowledge-base/03_actores_y_roles.md) | Actores, RBAC, rutas públicas |
| [04_modelo_de_datos.md](knowledge-base/04_modelo_de_datos.md) | Entidades, ERD, seed |
| [05_reglas_de_negocio.md](knowledge-base/05_reglas_de_negocio.md) | Reglas codificadas (RN-XX) |
| [06_funcionalidades.md](knowledge-base/06_funcionalidades.md) | Historias de usuario por épica |
| [07_flujos_principales.md](knowledge-base/07_flujos_principales.md) | Flujos E2E |
| [08_arquitectura_propuesta.md](knowledge-base/08_arquitectura_propuesta.md) | Patrones, estructura, env vars |
| [10_preguntas_abiertas.md](knowledge-base/10_preguntas_abiertas.md) | ⚠️ Inconsistencias a resolver ANTES de codear |

> ⚠️ Resolver las preguntas de prioridad **Alta** de `10_preguntas_abiertas.md` antes de arrancar el primer change
> (asignación de sillón automática vs manual, token del paciente, confirmación de alcance solo-backend).

---

## Skills Disponibles

Fuente de verdad: `.atl/skill-registry.md` (generado por `skill-registry`). En este proyecto **no se instalaron skills de dominio**; están disponibles las skills globales de orquestación/SDD.

| Agente | Rol | Skills que carga |
|--------|-----|------------------|
| **Orquestación / SDD** | Fundación, KB, roadmap, reglas, OPSX | `active-orchestrator`, `kb-creator`, `roadmap-generator`, `agents-md-generator`, `skill-registry` |
| **Discovery / Research** | Investigación de mercado y competidores | `discovery-research`, `web-scraper` |
| **Backend Core** | Dominio + API Node | — (sin skill de dominio instalada) |
| **QA / Testing** | Tests con `node:test` | — (sin skill de dominio instalada) |
| **Meta / Skills** | Crear/optimizar skills | `skill-creator`, `find-skills` |

Cargá la skill correspondiente al contexto ANTES de escribir código.

> Los compact rules de cada skill los resuelve el orquestador desde `.atl/skill-registry.md` (generado por `skill-registry`; no versionado — no está en el repo). Esta tabla solo mapea skill→rol.

---

## Roadmap de Changes

El plan de implementación completo está en [CHANGES.md](CHANGES.md). Resumen:

- **Total**: 18 changes en 6 fases (13 MVP + 5 post-MVP).
- **Camino crítico** (6): `C-01 → C-02 → C-04 → C-06 → C-08 → C-09` (+ rama casi-crítica `C-12 → C-13`).
- **Primer change**: `C-01` (crear-turno-sin-solapamientos).

**Antes de cualquier `/opsx:propose`**: leé [CHANGES.md](CHANGES.md), identificá las dependencias del change y los archivos de "Leer antes".

---

## Reglas Duras

> En este entorno **no existe** un `~/.claude/CLAUDE.md` global, por eso también viven acá las reglas universales (commit/build/secretos).

**Universales**
- **U1** — NUNCA commitear, pushear ni crear PR sin pedido explícito → hacer solo cuando el usuario lo pida.
- **U2** — NUNCA instalar dependencias ni buildear sin pedido explícito → hacer solo cuando el usuario lo pida.
- **U3** — Commits en formato conventional, **sin co-autoría de IA** → nada de `Co-authored-by:` de agentes.
- **U4** — NUNCA commitear secretos → `.env` ignorado; tokens y credenciales solo por variables de entorno.

**Stack Node.js / API**
- **S1** — NUNCA agregar dependencias externas en el MVP → usar módulos nativos (`node:http`, `node:test`, `node:assert`).
- **S2** — NUNCA hardcodear configuración (puerto, zona horaria, ventana de cancelación) → variables de entorno.
- **S3** — NUNCA hacer IO (red/disco) dentro de `domain/` → el dominio es puro y testeable.
- **S4** — Tests siempre con `node --test`; NUNCA mergear con tests en rojo ni saltear/borrar tests para pasar.
- **S5** — Usar **CommonJS** (`require` / `module.exports`), `const`/`let`; NUNCA `var`.

**Dominio (turnos)**
- **D1** — NUNCA permitir solapamiento de turnos por profesional, sillón o paciente → validar siempre (RN-TU-01..03 / RN-SI-02).
- **D2** — NUNCA aceptar duración manual → derivarla de la prestación (RN-TU-04 / RN-PR-01).
- **D3** — NUNCA cancelar con menos de 24 h de anticipación (ventana configurable) → rechazar (RN-CA-01).
- **D4** — Fechas siempre en `America/Argentina/Buenos_Aires` (RN-GL-01).
- **D5** — WhatsApp SIEMPRE detrás del puerto `Notificador` → NUNCA acoplar el dominio a un proveedor (DD-03).
- **D6** — NUNCA almacenar datos reales de pacientes en el repositorio, tests ni ejemplos → usar solo datos ficticios.

---

## Flujo de Trabajo

```
1. Leer la KB relevante (knowledge-base/)        → entender el dominio
2. Identificar el change en CHANGES.md           → respetar dependencias
3. /opsx:propose C-NN-nombre                     → proposal + design + specs + tasks
4. Implementar las tasks (cargando skills)       → respetando las reglas duras
5. /opsx:archive C-NN-nombre + marcar [x]        → cerrar el change
```

Aplicar TODAS las reglas duras en cada paso. Ante conflicto entre la KB y este archivo, las reglas duras prevalecen.
