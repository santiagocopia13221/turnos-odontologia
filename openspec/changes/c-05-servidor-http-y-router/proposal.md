# Propuesta

## Why

C-01 ya entregó el dominio puro y el servicio de aplicación, pero el proyecto todavía no tiene una superficie HTTP: no existe servidor, router, parseo de JSON ni un contrato uniforme de errores. Sin esa base, C-05b, C-06, C-07 y C-11 no pueden exponer la creación, consulta ni administración de turnos. Este change construye la infraestructura HTTP mínima sobre la que esos changes registrarán sus rutas.

## What Changes

- **Servidor nativo `node:http`**: `src/infrastructure/http/server.js` crea el servidor, atiende solicitudes y centraliza la serialización de respuestas JSON.
- **Router propio mínimo**: registro de rutas por método y ruta exacta, con soporte para módulos de rutas inyectables. C-05 solo registra `GET /health`; no agrega rutas de turnos.
- **Parseo de JSON del cuerpo**: lee el body de las solicitudes, lo parsea como JSON y entrega el resultado al handler. Un cuerpo no vacío con JSON inválido responde `400` con código `DATOS_INVALIDOS`.
- **Manejo central de errores**: toda respuesta de error usa el cuerpo uniforme `{ error: { code, message } }` y traduce los códigos de dominio a `400`, `404`, `409`, `422` o `500` según un catálogo estable.
- **`GET /health`**: responde `200` con `{ "status": "ok" }`, verificable sin depender de datos ni del reloj.
- **Arranque inyectable y cierre limpio**: `src/index.js` exporta una función de arranque que acepta puerto (`0` = puerto efímero), host, repositorios, reloj (`ahora`), módulos de rutas y logger. Devuelve un handle con el puerto real y una función `cerrar()` idempotente. C-05b podrá inyectar su reloj y su seed de demostración sin crear un segundo servidor.
- **CORS mínimo de desarrollo**: encabezados CORS permisivos y respuesta a preflight `OPTIONS`, documentados como configuración de desarrollo; C-15 los reemplazará por una política productiva.
- **Tests E2E**: `node:test` con `fetch` nativo sobre un puerto efímero, sin puerto fijo y con cierre del servidor en `t.after`.

**No incluye** (queda para changes posteriores):

- Routes de turnos (`POST /turnos`, consultas, cancelación, reprogramación) — C-05b, C-06, C-07, C-08 y C-09.
- OpenAPI/Swagger UI — C-05b.
- Autenticación o autorización — C-15.
- Persistencia real — C-16.
- Franjas, bloqueos, disponibilidad y auto-asignación de sillón — C-02 y C-04.
- Rate limiting, TLS, logging estructurado, compresión o CORS productivo.

Sin cambios disruptivos (**BREAKING**): none.

## Capabilities

### New Capabilities

- `http-server`: servidor HTTP nativo con router por método/ruta, parseo de JSON, manejo uniforme de errores, `GET /health`, CORS mínimo de desarrollo y arranque inyectable con cierre limpio.

### Modified Capabilities

- (ninguna). La capacidad `turnos` describe el dominio y no cambia; C-05 agrega una capa de transporte que no registra rutas de turnos.

## Impact

- **Nuevos archivos previstos**: `src/infrastructure/http/server.js`, `src/infrastructure/http/router.js`, `src/infrastructure/http/errors.js`, `src/index.js` y `tests/http.test.js`.
- **Dependencias**: C-01 (completado), del que se reutilizan los repositorios in-memory y el seed mínimo. No depende de C-02, C-03, C-04 ni C-05b.
- **Dependencias externas**: ninguna de npm; solo módulos nativos (`node:http`, `node:test`, `node:assert` y `fetch` global de Node 20).
- **Desbloquea**: C-05b, C-07 y C-11, que registran sus rutas sobre este servidor. C-05b espera exactamente el servidor, router, parseo JSON, manejo central de errores y `GET /health` que define este change.
- **Compatibilidad**: no modifica los artefactos archivados de C-01 ni el seed existente; el seed de demostración de C-05b se inyecta como dependencia.

## Supuestos registrados (decisiones tomadas acá)

- El puerto se toma del argumento `puerto` y, si se omite, de `PORT`; no se usa un puerto fijo hardcodeado (regla S2). Un valor ausente o inválido produce un error de configuración al arrancar.
- El host por defecto es `127.0.0.1` (bind local) para un servidor de desarrollo sin autenticación; se puede sobrescribir por argumento.
- Los códigos HTTP propios de la capa HTTP son `RUTA_NO_ENCONTRADA` (`404`), `DATOS_INVALIDOS` (`400`) y `ERROR_INTERNO` (`500`). Los códigos de dominio conservan su nombre y se mapean según el catálogo de C-05.
- Un método no registrado para una ruta existente también responde `404 RUTA_NO_ENCONTRADA`; C-05 no introduce `405`.
- El router de C-05 resuelve rutas exactas y descarta el query string para el matching; los parámetros de ruta se incorporarán cuando un change que los necesite (C-07) extienda el router.
- `GET /health` no lee repositorios ni reloj: su respuesta es constante.
