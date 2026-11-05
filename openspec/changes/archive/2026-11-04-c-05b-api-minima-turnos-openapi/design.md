# Design

## Context

C-01 ya entregó el dominio puro, el servicio de aplicación y los repositorios in-memory (ver `../../../../src/` y el change archivado). El proyecto usa CommonJS, `node:test` y `node:http`, sin dependencias externas (S1/S5). C-05 todavía no está implementado; este change lo toma como **prerrequisito** y no lo reimplementa.

Restricciones que moldean el approach:

- El dominio es puro y no hace IO (S3); toda validación de transporte vive en `infrastructure/http`.
- La configuración se lee por variables de entorno (S2); el endpoint no hardcodea puerto ni zona horaria.
- Los tests corren con `node --test` (S4) y no deben depender de servicios externos.
- La documentación Swagger puede usar CDN, pero la API y los tests no deben depender de esa CDN.

Ver `proposal.md` para la motivación y `specs/api-turnos/spec.md` para el contrato observable.

## Goals / Non-Goals

**Goals:**

- Agregar `POST /turnos` reutilizando el servidor, router y manejo de errores de C-05.
- Traducir los errores tipados del dominio a un contrato HTTP estable y documentado.
- Publicar un OpenAPI navegable y un seed de demostración con IDs estables.
- Cubrir el corte vertical con tests HTTP deterministas.

**Non-Goals:**

- Implementar C-05, C-02, C-03, C-04, C-06, C-07, C-08, C-09, C-12, C-13, C-15 o C-16.
- Cambiar el dominio, el servicio de aplicación o el change archivado C-01.
- Generar OpenAPI automáticamente desde el código ni agregar un build step.
- Persistencia, autenticación, CORS productivo, TLS o rate limiting.

## Decisions

### D1 - Reutilizar el servidor y el router de C-05

`POST /turnos` se registra como un módulo de rutas sobre el router existente de C-05. No se crea un segundo servidor ni un segundo manejador global de errores. C-05 sigue siendo dueño de `node:http`, parseo JSON, `GET /health`, CORS de desarrollo y el mapeo de errores no controlados.

*Alternativa considerada*: un servidor independiente para este change. **Rechazada** porque duplicaría infraestructura y generaría dos formas de arrancar la API.

### D2 - IDs explícitos y seed de demostración estable

El cuerpo exige `pacienteId` y `sillonId`. Para que el endpoint sea invocable sin leer el código, `src/index.js` (C-05) usará un seed de demostración con IDs fijos y datos ficticios (`prof-1`, `sillon-1`, `prestacion-consulta`, `paciente-ana`, etc.). El seed se agrega en un módulo nuevo y no modifica el seed de C-01.

*Alternativas consideradas*:
- **Resolver paciente por teléfono**: se rechaza porque pertenece a C-03 y amplía el alcance.
- **Asignar sillón automáticamente**: se rechaza porque pertenece a C-04 y la pregunta de negocio sigue abierta.
- **Exponer `GET /catalogo`**: se rechaza para no duplicar C-07; los IDs estables y los ejemplos de OpenAPI alcanzan para la demo.

### D3 - Validación en el borde, sin tocar el dominio

El handler valida forma y tipos antes de llamar a `turnosService.crearTurno`. Las reglas de negocio (solapamiento, duración derivada, fecha en pasado, referencias) siguen en el dominio y el servicio existentes. Si la validación de borde falla, se responde `400 DATOS_INVALIDOS`; no se inventan reglas nuevas.

*Alternativa considerada*: agregar validación al servicio. **Rechazada** porque mezcla transporte con dominio y afecta a C-01.

### D4 - Fecha ISO 8601 con offset obligatorio

`fechaHoraInicio` debe ser una fecha-hora ISO 8601 con offset explícito (`Z` o `±HH:MM`). Se valida con una expresión regular y `Date.parse`; se rechazan fechas sin offset, fechas solas y valores no parseables. Esto evita que el resultado dependa de la zona horaria del proceso y prepara el terreno para RN-GL-01. El reloj (`ahora`) es inyectable y los tests lo fijan en un instante concreto (por ejemplo `2026-11-03T12:00:00-03:00`); las fechas de ejemplo de los escenarios son posteriores a ese instante y no dependen del reloj real.

*Alternativa considerada*: aceptar cualquier string que `new Date()` entienda. **Rechazada** porque acepta formatos ambiguos y depende del TZ del servidor.

### D5 - Mapeo de errores a HTTP

| Código de dominio / borde | HTTP | Cuándo |
|---|---|---|
| `DATOS_INVALIDOS` | `400` | JSON malformado, campo faltante, tipo incorrecto, fecha o canal inválidos |
| `PROFESIONAL_OCUPADO`, `SILLON_OCUPADO`, `PACIENTE_OCUPADO` | `409` | Solapamiento de agenda |
| `REFERENCIA_INEXISTENTE`, `DURACION_INVALIDA`, `FECHA_EN_PASADO` | `422` | Referencia o valor semánticamente inválido |
| Error inesperado | `500` | Falla no controlada |

El cuerpo de error es uniforme: `{ "error": { "code": "...", "message": "..." } }`. El `code` se conserva; el status HTTP no lo reemplaza. `REFERENCIA_INEXISTENTE` se trata como `422` porque el cuerpo está bien formado pero referencia datos que no existen; C-06 puede revisar esta decisión si el contrato cambia.

*Alternativa considerada*: devolver `404` para referencias inexistentes. **Rechazada** porque el recurso solicitado (`/turnos`) existe; lo inválido es una referencia del cuerpo.

### D6 - Serialización explícita del turno

El handler no devuelve el objeto de dominio crudo. Un serializador convierte `Date` a ISO 8601 (`toISOString()`), expone `id`, referencias, `fechaHoraInicio`, `fechaHoraFin`, `estado`, `canalReserva`, `creadoEn` y `actualizadoEn`, y omite campos internos. La respuesta usa instantes UTC (`Z`) con milisegundos, tal como los emite `Date.prototype.toISOString()` (por ejemplo `2026-11-10T12:30:00.000Z`); no se emite offset `-03:00` en la salida. La representación local AR se resolverá en C-02/C-07.

*Alternativa considerada*: `JSON.stringify(turno)` directo. **Rechazada** porque acopla el contrato a la forma interna y a cómo `JSON` serializa `Date`.

### D7 - OpenAPI 3.0.3 escrito a mano

El documento se mantiene como un objeto JavaScript en `infrastructure/http/openapi.js` y se sirve en `GET /openapi.json`. Se elige OpenAPI 3.0.3 por compatibilidad amplia con Swagger UI y porque no se necesitan features de 3.1. Los ejemplos usan los IDs estables del seed de demostración. El ejemplo de request no se congela en el archivo: al servir el documento se calcula `fechaHoraInicio` a partir del reloj inyectado (`ahora`) como el día siguiente a las 10:00 con offset `-03:00`, de modo que el ejemplo publicado sea siempre futuro, también en el servidor de demostración con reloj real. El resto del documento es estático.

*Alternativa considerada*: OpenAPI 3.1. **Rechazada** por compatibilidad y porque no aporta nada al contrato mínimo. *Alternativa considerada*: generar el documento con anotaciones/JSDoc. **Rechazada** porque requeriría dependencias o un build step (S1).

### D8 - Swagger UI por CDN, solo en `/docs`

`GET /docs` devuelve un HTML estático con CSS/JS de `swagger-ui-dist` desde unpkg usando la versión EXACTA `5.11.0` (archivos `swagger-ui.css` y `swagger-ui-bundle.js`), apuntando a `/openapi.json`. No se usa `swagger-ui-standalone-preset.js`. No se agrega ningún paquete npm. La página es solo documentación: si la CDN no está disponible, la API y `/openapi.json` siguen funcionando.

*Alternativa considerada*: servir Swagger UI desde `node_modules` o vendorizarlo. **Rechazada** por S1 y para no sumar peso al repo. *Alternativa considerada*: una página HTML propia sin Swagger UI. **Rechazada** porque el pedido es Swagger/OpenAPI navegable.

### D9 - Tests HTTP deterministas

Los tests levantan el servidor en el puerto `0` (efímero), inyectan `ahora` con un instante fijo (por ejemplo `2026-11-03T12:00:00-03:00`) y usan `fetch` nativo de Node 20. El servidor se cierra en `t.after`. No se usa un puerto fijo ni se depende de la CDN. Se cubren: camino feliz, `400`, `409`, `422`, `/openapi.json`, `/docs` y el ejemplo documentado; el test del ejemplo verifica que, con el reloj fijo, el `fechaHoraInicio` publicado (`2026-11-04T10:00:00-03:00`) es futuro y que el `POST` responde `201` con fechas UTC exactas.

*Alternativa considerada*: tests unitarios del handler sin servidor. **Rechazada** como única cobertura porque no validan status, headers ni serialización real.

### D10 - Sin nuevas variables de entorno

C-05 ya resuelve `PORT`/`TZ` desde env. Este change no agrega configuración: el seed de demostración es fijo y los IDs son constantes del módulo de demo. No se hardcodea puerto en el código de producción.

### D11 - Duración enviada por el cliente

El body no debe aceptar `duracionMinutos` enviado por el cliente. La duración se deriva siempre de la prestación (RN-TU-04, RN-PR-01). Si se envía `duracionMinutos`, la validación de borde responde `400` con código `DATOS_INVALIDOS` y no crea el turno.

### D12 - Prelación de códigos en conflicto simultáneo

Si profesional, sillón y paciente están ocupados a la vez en el mismo intervalo solicitado, la traducción de errores HTTP debe responder con el código del profesional primero, después el del sillón y por último el del paciente (orden de RN-TU-01, RN-TU-02 y RN-TU-03): `PROFESIONAL_OCUPADO`, luego `SILLON_OCUPADO`, luego `PACIENTE_OCUPADO`.

### Decisión abierta - Referencias inactivas

Las reglas RN-PR-02 y RN-SI-03 exigen prestación activa (`Prestacion.activo = true`) y sillón activo (`Sillon.activo = true`). El dominio hoy solo valida existencia. **Pregunta abierta:** ¿Quién valida `Prestacion.activo` y `Sillon.activo`, y con qué código de error? No existe código estable para el caso 'referencia inactiva'. Esto queda fuera de alcance de C-05b y debe resolverse antes del TPI.

## Risks / Trade-offs

- **[C-05 no implementado] el change queda bloqueado** → Mitigación: implementar C-05 primero; C-05b solo agrega la ruta y la documentación sobre esa base.
- **[El seed de demostración duplica datos de C-01 y puede desincronizarse]** → Mitigación: datos ficticios, IDs centralizados y un test que ejecuta el ejemplo publicado; C-07 reemplaza el seed por endpoints de catálogo.
- **[La CDN de Swagger UI no está disponible sin internet] `/docs` no renderiza** → Mitigación: `/openapi.json` sigue disponible; se documenta la limitación. La API no depende de la CDN.
- **[El OpenAPI escrito a mano se desincroniza del handler]** → Mitigación: test que verifica la operación, los esquemas y las respuestas principales; C-06 debe actualizar ambos.
- **[El ejemplo con fecha relativa puede quedar desfasado respecto del reloj real]** → Mitigación: el ejemplo se recalcula en cada `GET /openapi.json` desde el mismo reloj inyectado; los tests lo fijan para obtener un resultado determinista.
- **[Fechas devueltas en UTC pueden confundir a un cliente que espera `-03:00`]** → Mitigación: el contrato fija el formato exacto (`toISOString()`, UTC con milisegundos y `Z`); la representación AR se resuelve en C-02/C-07.
- **[Endpoint sin autenticación]** → Mitigación: es un corte de desarrollo/demo; C-15 lo protege. C-05 puede limitar el bind a localhost por defecto.
- **[Datos en memoria se pierden al reiniciar]** → Aceptado en el MVP (DD-01); C-16 agrega persistencia sin cambiar el contrato.
- **[`422` para referencias inexistentes puede no coincidir con la expectativa de C-06]** → Mitigación: decisión explícita y documentada; si C-06 cambia el contrato, se actualiza el spec y el OpenAPI.

## Migration Plan

1. Implementar C-05 y verificar que el servidor, router, `GET /health` y el manejo central de errores estén en verde.
2. Aplicar C-05b: seed de demostración, validador de entrada, handler, serializador, rutas, OpenAPI y `/docs`.
3. Correr `node --test` y verificar que todos los tests (C-01 + C-05b) pasen.
4. Rollback: eliminar los archivos agregados por C-05b y volver al estado de C-05; no hay datos persistidos que migrar.

## Open Questions

Ninguna que bloquee el diseño. La firma exacta del router de C-05 se adapta al implementarlo, sin cambiar el contrato HTTP definido en el spec.
