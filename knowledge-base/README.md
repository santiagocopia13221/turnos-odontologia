# turnos-odontologia — Base de Conocimiento

Base de conocimiento del backend (API) de gestión de turnos para un consultorio odontológico
con varios profesionales y varios sillones. Generada a partir de la fase de Discovery y del
Q&A de arquitectura.

## Índice de Archivos

| Archivo | Contenido |
|---------|-----------|
| [01_vision_y_objetivos.md](01_vision_y_objetivos.md) | Propósito, objetivos por actor, alcance del MVP, fuera de alcance |
| [02_descripcion_general.md](02_descripcion_general.md) | Stack, arquitectura general, integraciones, endpoints REST |
| [03_actores_y_roles.md](03_actores_y_roles.md) | Actores, matriz RBAC, rutas públicas |
| [04_modelo_de_datos.md](04_modelo_de_datos.md) | Dominios, ERD, entidades, seed data |
| [05_reglas_de_negocio.md](05_reglas_de_negocio.md) | Reglas codificadas (RN-XX-NN) |
| [06_funcionalidades.md](06_funcionalidades.md) | Historias de usuario por épica |
| [07_flujos_principales.md](07_flujos_principales.md) | Flujos extremo a extremo |
| [08_arquitectura_propuesta.md](08_arquitectura_propuesta.md) | Patrones, estructura, seguridad, env vars |
| [09_decisiones_y_supuestos.md](09_decisiones_y_supuestos.md) | Decisiones (DD) y supuestos (SU) |
| [10_preguntas_abiertas.md](10_preguntas_abiertas.md) | Inconsistencias y preguntas priorizadas |

## Quick Start para Desarrolladores

1. Entender el dominio → [01](01_vision_y_objetivos.md), [03](03_actores_y_roles.md)
2. Entender los datos → [04](04_modelo_de_datos.md)
3. Entender las reglas → [05](05_reglas_de_negocio.md)
4. Entender la arquitectura → [02](02_descripcion_general.md), [08](08_arquitectura_propuesta.md)
5. Implementar → [07](07_flujos_principales.md), [06](06_funcionalidades.md)
6. Antes de codificar → [10](10_preguntas_abiertas.md)

## Resumen Ejecutivo

Backend (API) para que un consultorio odontológico gestione turnos sin coordinación manual:
reserva online sin login (nombre + teléfono), cancelación/reprogramación con regla de 24 h,
agenda diaria por profesional y por sillón, y prevención de solapamiento (profesional, sillón y
paciente). MVP sin interfaz gráfica, con base de datos en memoria y tests con el runner de Node;
WhatsApp queda detrás de un adapter (stub en el MVP).

## Fuentes

- `discovery/discovery.md` — Discovery de producto.
- `docs/discovery/informe-discovery.md` — investigación de mercado competitiva.
- `.active-orchestrator-state.json` — estado de la fundación (sección `discovery`).
