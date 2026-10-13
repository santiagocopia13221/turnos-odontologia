# Decisiones y Supuestos

## Decisiones documentadas

### DD-01 — Solo backend, sin interfaz gráfica en el MVP
**Decisión**: el sistema es una **API REST**; no se construye UI web/móvil.
**Contexto**: se busca validar el modelo de dominio y las reglas de negocio antes de invertir en UI.
**Alternativas consideradas**: app web full-stack; SPA + API.
**Justificación**: minimiza costo y tiempo; las reglas de negocio son el núcleo de riesgo.
**Trade-offs aceptados**: no hay producto usable por el paciente todavía; se consumirá con curl/tests.

### DD-02 — Node.js sin dependencias externas + `node:test` + DB en memoria
**Decisión**: runtime Node.js con `node:http`, persistencia en memoria y tests con `node:test`.
**Contexto**: prioridad "lo más simple" con presupuesto acotado.
**Alternativas consideradas**: Express/Fastify; Postgres/SQLite; Jest/Vitest.
**Justificación**: cero instalación de terceros, arranque inmediato, ideal para el MVP.
**Trade-offs aceptados**: los datos no persisten entre reinicios; menos ergonomía de routing.

### DD-03 — WhatsApp detrás de un puerto (adapter stub)
**Decisión**: los recordatorios se implementan contra un puerto `Notificador`; en MVP el adapter es
`whatsappStub` (no envía de verdad).
**Contexto**: el envío real requiere proveedor, credenciales y costos.
**Alternativas consideradas**: integrar Meta Cloud API ya; usar Twilio.
**Justificación**: permite modelar y testear el flujo de recordatorios sin acoplarse a un proveedor.
**Trade-offs aceptados**: no hay recordatorios reales en el MVP.

### DD-04 — Autenticación diferida
**Decisión**: no se implementa auth; los roles se documentan pero no se enforce.
**Contexto**: la API simple y sin UI no lo requiere para validar el dominio.
**Alternativas consideradas**: JWT propio; API keys; sesiones.
**Justificación**: evita complejidad prematura en el MVP.
**Trade-offs aceptados**: los endpoints de staff quedan sin protección (solo ambiente de desarrollo).

### DD-05 — Duración del turno derivada de la prestación
**Decisión**: la duración no se ingresa; se toma de `Prestacion.duracionMinutos`.
**Contexto**: RN-TU-04; evita inconsistencias y slots mal calculados.
**Justificación**: una sola fuente de verdad para la duración.
**Trade-offs aceptados**: requiere mantener el catálogo de prestaciones.

### DD-06 — Un turno ocupa exactamente un sillón
**Decisión**: la relación Turno–Sillón es 1:1 (un turno usa un sillón durante toda su duración).
**Contexto**: el caso de uso es un consultorio con boxes; no se modelan sillones compartidos.
**Justificación**: simplifica el modelo y las validaciones de solapamiento.
**Trade-offs aceptados**: no se soportan prestaciones que liberen el sillón a mitad de camino.

## Supuestos inferidos

### SU-01 — Horarios de atención por profesional
**Supuesto**: cada profesional define sus franjas (`HorarioAtencion`).
**Origen**: caso de uso "agenda diaria por profesional y por sillón".
**Riesgo si es falso**: si las franjas fueran del consultorio (no del profesional), cambia el modelo.
**Cómo validar**: confirmar con el consultorio en la próxima entrevista.

### SU-02 — Paciente identificado por teléfono normalizado
**Supuesto**: nombre + teléfono alcanzan para identificar/reutilizar al paciente.
**Origen**: RN-RO-01/02, MVP sin login.
**Riesgo si es falso**: familias que comparten teléfono podrían mezclarse.
**Cómo validar**: definir regla de desambiguación (ver 10).

### SU-03 — Zona horaria Argentina
**Supuesto**: todas las fechas son `America/Argentina/Buenos_Aires`.
**Origen**: mercado objetivo (AR) del informe de Discovery.
**Riesgo si es falso**: desfasajes en slots y recordatorios.
**Cómo validar**: confirmar si se atenderán otras regiones.

### SU-04 — Single-tenant, un solo consultorio
**Supuesto**: no hay multi-sucursal/multi-tenant en el MVP.
**Origen**: preguntas de Discovery y elección "lo más simple".
**Riesgo si es falso**: habría que introducir `organizacionId` y aislamiento de datos.
**Cómo validar**: definir objetivo de producto (herramienta interna vs SaaS).

### SU-05 — Asignación de sillón automática
**Supuesto**: el sistema elige un sillón libre para el profesional/prestación.
**Origen**: RN-RO-03 (pendiente de confirmar).
**Riesgo si es falso**: si la recepción asigna sillón manualmente, cambia la API de reserva.
**Cómo validar**: ver pregunta abierta de asignación de sillón.
