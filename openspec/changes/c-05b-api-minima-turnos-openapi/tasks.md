# Tasks

## 1. Base HTTP y datos de demostración

- [ ] 1.1 Confirmar que C-05 está implementado y expone servidor, router, parseo JSON, manejo central de errores y `GET /health`; verificación: `GET /health` responde `200 { "status": "ok" }` y `node --test` sigue en verde
- [ ] 1.2 Crear el módulo de seed de demostración con IDs estables y datos ficticios (`prof-1`, `sillon-1`, `prestacion-consulta`, `paciente-ana`, etc.); verificación: un test verifica los IDs y la cantidad de entidades sembradas
- [ ] 1.3 Conectar el seed de demostración en `src/index.js` sin modificar el seed de C-01; verificación: al arrancar el servidor, los IDs documentados existen en los repositorios en memoria

## 2. Validación de entrada y errores HTTP

- [ ] 2.1 Implementar el validador de borde para cuerpo JSON, campos obligatorios, tipos, `canalReserva` (`ONLINE`/`RECEPCION`) y `fechaHoraInicio` ISO 8601 con offset; verificación: tests cubren JSON malformado, campo faltante, tipo incorrecto, fecha sin offset, fecha inválida y canal inválido, todos con `400 DATOS_INVALIDOS`. Agregar test: cuando el cuerpo incluye `duracionMinutos` → responde `400` con código `DATOS_INVALIDOS` y no crea el turno (RN-TU-04/RN-PR-01).
- [ ] 2.2 Implementar el mapeo de errores a HTTP con cuerpo `{ error: { code, message } }`; verificación: tests cubren `409` para los tres solapamientos, prelación en conflicto simultáneo (profesional → sillón → paciente), `422` para `REFERENCIA_INEXISTENTE`/`DURACION_INVALIDA`/`FECHA_EN_PASADO` (este último con reloj inyectado fijo) y `500` para un error inesperado
- [ ] 2.3 Implementar el serializador de turno con fechas ISO 8601, referencias, estado, canal y tiempos de creación/actualización; verificación: test confirma que las fechas son strings UTC con milisegundos y sufijo `Z` (`toISOString()`) y que `fechaHoraFin` refleja la duración de la prestación

## 3. Endpoint `POST /turnos`

- [ ] 3.1 Implementar el handler que valida, llama a `turnosService.crearTurno` y responde `201` con el turno serializado; verificación: test E2E con el reloj inyectado crea un turno `RESERVADO` y devuelve un `id` no vacío
- [ ] 3.2 Registrar `POST /turnos` en el router de C-05 sin crear un segundo servidor; verificación: test HTTP confirma `201` en el camino feliz y `404` en una ruta desconocida
- [ ] 3.3 Verificar que el cuerpo exige `pacienteId` y `sillonId` y que no se reasigna sillón ni se resuelve paciente; verificación: tests confirman `400` al omitirlos, `409 SILLON_OCUPADO` cuando el sillón está ocupado, **contigüidad por sillón (fin == inicio) → 201**, **contigüidad por paciente (fin == inicio) → 201**, y **conflicto simultáneo profesional/sillón/paciente con prelación `PROFESIONAL_OCUPADO`**. Las referencias inactivas (`Prestacion.activo`/`Sillon.activo`) quedan fuera de alcance de C-05b (sin validación ni código nuevo) y deben resolverse antes del TPI.
- [ ] 3.4 Agregar el default `ONLINE` para `canalReserva` y rechazar valores fuera del enum; verificación: tests confirman el default y el `400` con valor inválido

## 4. OpenAPI y Swagger UI

- [ ] 4.1 Crear el documento OpenAPI 3.0.3 en `src/infrastructure/http/openapi.js` con `POST /turnos`, esquemas de request/response y respuestas `201`, `400`, `409`, `422` y `500`; el ejemplo de request calcula `fechaHoraInicio` desde el reloj inyectado (día siguiente a las 10:00 con offset `-03:00`); verificación: `GET /openapi.json` responde `200` JSON y contiene `paths./turnos.post` con esos códigos y una fecha futura respecto del reloj inyectado
- [ ] 4.2 Servir `GET /docs` con una página HTML que cargue Swagger UI desde CDN y apunte a `/openapi.json`; verificación: test confirma `200`, `Content-Type` HTML y referencias a Swagger UI y `/openapi.json`
- [ ] 4.3 Documentar en OpenAPI los IDs estables del seed de demostración como ejemplos; verificación: test compara los ejemplos con los IDs sembrados y ejecuta el ejemplo documentado contra el servidor con reloj inyectado fijo, obteniendo `201` y fechas UTC exactas

## 5. Integración y regresión

- [ ] 5.1 Correr la suite completa con `node --test`; verificación: todos los tests de C-01 y C-05b pasan sin fallos
- [ ] 5.2 Hacer un smoke manual del servidor: `POST /turnos` con el ejemplo de OpenAPI, `GET /openapi.json` y `GET /docs`; verificación: el ejemplo publicado es futuro respecto del reloj del servidor, el turno se crea, el contrato descarga y la página de documentación responde
- [ ] 5.3 Confirmar que no se modificaron artefactos ni archivos del change archivado C-01; verificación: `git diff` no muestra cambios en `openspec/changes/archive/2026-10-13-c-01-...` ni en `src/domain`/`tests/` de C-01

## Workflow follow-up

- Archivar el change con `/opsx-archive` cuando la revisión del proyecto esté satisfecha.
- Marcar `[C-05b]` como completado (`[x]`) en `CHANGES.md` al archivar.
- Verificar que la entrada de C-06 indique que extiende este handler con C-03/C-04 y que C-07 reemplaza el seed de demostración.
