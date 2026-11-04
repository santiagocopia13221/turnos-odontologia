# Tasks

## 1. Router propio

- [x] 1.1 Implementar `src/infrastructure/http/router.js` con `crearRouter()`, `registrar(metodo, ruta, handler)` y `resolver(metodo, ruta)` usando método en mayúsculas y path exacto; verificación: un test unitario registra una ruta, la resuelve con el mismo método/path y obtiene `404` para otra combinación
- [x] 1.2 Ignorar el query string en el matching y exponerlo al handler; verificación: un test resuelve `GET /health?detalle=1` contra `GET /health` y confirma que el query llega en el contexto
- [x] 1.3 Rechazar el registro duplicado de una ruta con un error de configuración; verificación: un test registra dos veces `GET /prueba` y confirma que la segunda registración falla

## 2. Errores HTTP y catálogo

- [x] 2.1 Implementar `src/infrastructure/http/errors.js` con `HttpError` y `mapearError(error)` para `400 DATOS_INVALIDOS`, `404 RUTA_NO_ENCONTRADA`, `409` solapamientos/`ESTADO_INVALIDO`, `422` errores semánticos y `500 ERROR_INTERNO`; verificación: tests unitarios cubren cada grupo y confirman que un error desconocido no filtra su mensaje interno
- [x] 2.2 Asegurar el cuerpo uniforme `{ error: { code, message } }`; verificación: un test confirma que el objeto mapeado contiene exactamente `error.code` y `error.message`

## 3. Servidor HTTP base

- [x] 3.1 Implementar `src/infrastructure/http/server.js` con `crearServidor({ repos, ahora, logger })`, despacho de rutas y registro de `GET /health`; verificación: `GET /health` responde `200` con `Content-Type` JSON y `{ "status": "ok" }`
- [x] 3.2 Agregar CORS de desarrollo y respuesta a preflight `OPTIONS` antes del matching; verificación: `GET /health` incluye `Access-Control-Allow-Origin: *` y `OPTIONS /turnos` responde `204` sin cuerpo con los encabezados CORS
- [x] 3.3 Implementar la lectura y el parseo del cuerpo JSON, con cuerpo vacío como `{}` y JSON inválido como `400 DATOS_INVALIDOS` sin invocar al handler; verificación: tests con una ruta inyectada cubren cuerpo válido, cuerpo vacío y JSON malformado
- [x] 3.4 Implementar la serialización de respuestas: objetos/arrays como JSON y strings/Buffer con los encabezados provistos por el handler; verificación: tests confirman el `Content-Type` JSON por defecto y un `Content-Type` de texto propio para un cuerpo string
- [x] 3.5 Conectar el manejo central de errores al despacho, incluyendo rutas desconocidas y errores lanzados por handlers; verificación: tests cubren `404 RUTA_NO_ENCONTRADA`, `409` por solapamiento, `422` semántico, `400 DATOS_INVALIDOS` y `500 ERROR_INTERNO`

## 4. Arranque, configuración y cierre

- [x] 4.1 Implementar `src/index.js` exportando `iniciarServidor({ puerto, host, repos, ahora, rutas, logger })` con creación de servidor, ejecución de módulos de rutas y escucha; verificación: un test arranca con puerto `0`, obtiene el puerto real y una ruta inyectada responde
- [x] 4.2 Resolver el puerto por argumento o `PORT`, rechazar ausencia/valores inválidos y no usar un puerto hardcodeado; verificación: tests confirman que `0` tiene prioridad sobre `PORT`, que un puerto inválido rechaza el arranque y que no queda ningún servidor escuchando
- [x] 4.3 Aplicar el seed de C-01 solo cuando no se inyectan repositorios; verificación: un test arranca sin `repos` y comprueba las entidades sembradas, y otro arranca con repos inyectados y confirma que C-05 no agregó entidades propias
- [x] 4.4 Implementar `cerrar()` idempotente con `server.close()` y `closeAllConnections()` cuando esté disponible; verificación: un test llama `cerrar()` dos veces y ambas promesas resuelven sin error
- [x] 4.5 Evitar que importar `src/index.js` arranque el servidor y registrar `SIGINT`/`SIGTERM` solo cuando se ejecuta como programa principal; verificación: un test hace `require('../src/index')` y no queda ningún puerto escuchando ni proceso colgado

## 5. Integración y regresión

- [x] 5.1 Ejecutar `node --test` y dejar toda la suite en verde; verificación: los 24 tests de C-01 y los nuevos tests HTTP pasan sin fallos
- [x] 5.2 Hacer un smoke con el servidor real: definir `PORT`, arrancar `node src/index.js` y consultar `GET /health`; verificación: responde `200 { "status": "ok" }` y el proceso se cierra limpio con `Ctrl+C`
- [x] 5.3 Confirmar que no se modificaron los artefactos archivados de C-01 ni sus archivos de dominio/tests; verificación: `git diff` no muestra cambios en `openspec/changes/archive/2026-10-13-c-01-...`, `src/domain/` ni en los tests de C-01

## Workflow follow-up

- Archivar el change con `/opsx-archive` cuando la revisión del proyecto esté satisfecha.
- Al archivar, actualizar el estado de `[C-05]` en `CHANGES.md` según el flujo del repositorio.
