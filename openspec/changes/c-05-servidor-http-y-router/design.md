# Design

## Context

C-01 ya entrega `src/domain` (puro), `src/application/turnosService.js` y `src/infrastructure/repos/inMemoryRepos.js` con seed mínimo. No existe `src/infrastructure/http/` ni `src/index.js`; `package.json` ya declara `main: src/index.js` y `test: node --test`.

Restricciones que moldean el approach:

- Stack Node.js >= 20, CommonJS y módulos nativos: `node:http`, `node:test`, `node:assert` y `fetch` global (S1/S5).
- El dominio no hace IO (S3); el servidor vive en `infrastructure/http` y no importa reglas de dominio para atender `GET /health`.
- La configuración (puerto, zona horaria) sale del entorno, no del código (S2/RN-GL-03).
- Los tests no pueden depender de un puerto fijo ni de servicios externos (S4).
- C-05b espera exactamente este borde: servidor, router, parseo JSON, manejo central de errores y `GET /health`, además de un arranque con reloj y seed inyectables.

Ver `proposal.md` para la motivación y `specs/http-server/spec.md` para el contrato observable.

## Goals / Non-Goals

**Goals:**

- Separar router, servidor y arranque para que C-05b/C-07/C-11 registren rutas sin duplicar infraestructura.
- Definir un contrato de handler y de respuesta suficientemente chico para JSON y suficientemente flexible para el HTML de `/docs`.
- Centralizar el mapeo de errores de dominio a HTTP en un único módulo reutilizable.
- Arrancar en puerto efímero, inyectar dependencias y cerrar de forma limpia e idempotente.

**Non-Goals:**

- Registrar `POST /turnos` ni cualquier ruta de turnos (C-05b/C-06/C-07).
- Serializar turnos, validar cuerpos de dominio o generar OpenAPI (C-05b).
- Implementar autenticación, límites de tasa, compresión, TLS, logs estructurados, límite de tamaño de body o CORS productivo.
- Extender el router con parámetros de path (`/turnos/:id`); eso lo hará C-07 cuando lo necesite.

## Decisions

### D1 - Tres módulos con responsabilidades separadas

- `src/infrastructure/http/router.js`: `crearRouter()` con `registrar(metodo, ruta, handler)` y `resolver(metodo, ruta)`. Mantiene un `Map` con clave `` `${METODO} ${ruta}` ``. Duplicar una ruta lanza un error de configuración en el registro.
- `src/infrastructure/http/errors.js`: `HttpError`, catálogo de códigos y `mapearError(error)`.
- `src/infrastructure/http/server.js`: `crearServidor({ repos, ahora, logger })`, parseo del body, CORS, despacho, serialización y manejo central de errores.
- `src/index.js`: `iniciarServidor(...)`, lectura de `PORT`, wiring por defecto de repos + seed de C-01, escucha, handle de cierre y señales cuando se ejecuta como programa principal.

*Alternativa considerada*: un único `server.js` con router y arranque embebidos. **Rechazada** porque C-05b necesita registrar rutas sobre el router sin arrastrar el arranque ni acoplarse a `process.env`.

### D2 - Contrato de handler y de respuesta

Un handler es una función (posiblemente `async`) que recibe un contexto:

```
{ req, res, body, query, deps }
```

y devuelve:

```
{ status = 200, body = null, headers = {} }
```

- `body` objeto/array → se serializa con `JSON.stringify` y `Content-Type: application/json; charset=utf-8`.
- `body` string/Buffer → se envía tal cual; si el handler proveyó `Content-Type`, se respeta (necesario para `/docs` en C-05b).
- `body` `null`/`undefined` → respuesta sin cuerpo (por ejemplo `204` de preflight).
- `deps` es el objeto inyectado en el arranque (`repos`, `ahora`, `logger`, etc.), de modo que C-05b puede cerrar sobre su servicio.

Los módulos de rutas son funciones `(router, deps) => void`; se ejecutan antes de escuchar y reciben las mismas dependencias. El arranque acepta `rutas: []` para que C-05b inyecte su módulo de turnos sin crear un segundo servidor.

*Alternativa considerada*: handlers que escriben directo en `res`. **Rechazada** como contrato principal porque duplica serialización y hace más difícil el manejo central de errores; el handler conserva `req`/`res` para casos avanzados.

### D3 - Resolución de rutas y query string

El matching usa método en mayúsculas y `pathname` exacto; el query string se parsea con `new URL(req.url, base)` y se expone al handler, pero no participa del matching. Un método no registrado para un path existente también es `404 RUTA_NO_ENCONTRADA`. C-05 solo registra `GET /health`.

*Alternativa considerada*: devolver `405` cuando el path existe pero el método no. **Rechazada** para mantener el router mínimo y porque el spec fija `404`; se puede introducir en un change posterior si el contrato lo requiere.

### D4 - Parseo de JSON en el borde

Para solicitudes con cuerpo, el servidor lee los chunks, arma un string y, si no está vacío, ejecuta `JSON.parse`. Un cuerpo vacío se entrega como `{}`. Un `SyntaxError` de parseo se traduce a `HttpError(400, 'DATOS_INVALIDOS', ...)` y no se invoca el handler. No se exige un `Content-Type` específico: el contrato se basa en que el cuerpo sea JSON válido, y C-05b valida la forma del objeto.

*Alternativa considerada*: exigir `application/json` y responder `415`. **Rechazada** porque agrega un status/código no pedido y complica clientes de demo; C-15 puede endurecerlo.

### D5 - Manejo central de errores

`mapearError(error)` devuelve `{ status, code, message }`:

| Origen | Status | Código |
|---|---|---|
| `HttpError` | el suyo | el suyo |
| `PROFESIONAL_OCUPADO`, `SILLON_OCUPADO`, `PACIENTE_OCUPADO` | `409` | se conserva |
| `FUERA_DE_FRANJA`, `FECHA_EN_PASADO`, `REFERENCIA_INEXISTENTE`, `DURACION_INVALIDA` | `422` | se conserva |
| `ESTADO_INVALIDO` | `409` | se conserva |
| Error no controlado | `500` | `ERROR_INTERNO` |

El cuerpo siempre es `{ error: { code, message } }`. Para `500` el mensaje es genérico y el error original se registra por `logger` (inyectable; por defecto `console`) sin incluirlo en la respuesta. El status HTTP no reemplaza al `code`.

*Alternativa considerada*: mapear cada error dentro de cada handler. **Rechazada** porque duplica la tabla, facilita inconsistencias entre C-05b y C-06 y mezcla transporte con handlers de dominio.

### D6 - CORS mínimo de desarrollo

`server.js` agrega a toda respuesta `Access-Control-Allow-Origin: *`, `Access-Control-Allow-Methods: GET, POST, OPTIONS` y `Access-Control-Allow-Headers: Content-Type`. Los `OPTIONS` se responden con `204` y sin cuerpo antes de resolver la ruta, para que el preflight de C-05b funcione aunque la ruta todavía no exista. Es una política explícitamente de desarrollo; C-15 la reemplaza.

*Alternativa considerada*: CORS configurable por env. **Rechazada** porque no hay variable en la KB y sumaría configuración sin uso productivo.

### D7 - Arranque, puerto y cierre

`iniciarServidor({ puerto, host = '127.0.0.1', repos, ahora, rutas = [], logger = console } = {})`:

1. Resuelve el puerto: argumento si está definido; si no, `process.env.PORT`. Debe ser un entero entre `0` y `65535`. Si falta o es inválido, rechaza con un error de configuración antes de escuchar (S2).
2. Si no se pasan `repos`, crea `crearRepositorios()` y aplica `sembrar(repos)` de C-01. Si se pasan, **no** siembra: C-05b inyecta sus repositorios con el seed de demostración.
3. Crea el servidor con `crearServidor`, ejecuta los módulos de `rutas` y escucha.
4. Resuelve `{ server, router, deps, puerto, url, cerrar }`, con el puerto real cuando se usó `0`.
5. `cerrar()` es idempotente: comparte una única promesa, llama `server.close()` y, si está disponible, `server.closeAllConnections()` para no colgarse con conexiones keep-alive. Si el servidor ya no escucha, resuelve sin error.

El host por defecto `127.0.0.1` limita el bind a local, coherente con un MVP sin autenticación. Cuando `src/index.js` se ejecuta como programa principal, registra `SIGINT`/`SIGTERM` para llamar `cerrar()` y salir; la función exportada no instala handlers globales, para no interferir con los tests.

*Alternativa considerada*: puerto por defecto `3000`. **Rechazada** porque S2 prohíbe hardcodear el puerto; el operador define `PORT` o pasa el argumento.

### D8 - Reloj y zona horaria

`ahora` se inyecta con default `() => new Date()` y se pasa en `deps` a los módulos de rutas. C-05 no calcula ni formatea fechas, por lo que no usa `TZ`; el proceso respeta la zona horaria configurada en el entorno y no la fija por código (RN-GL-01/RN-GL-03). C-05b usará `ahora` para fijar el ejemplo de OpenAPI y los tests; C-02/C-07 resolverán la representación local AR.

*Alternativa considerada*: leer `TZ` y pasarlo como dependencia. **Rechazada por ahora** porque no hay comportamiento de C-05 que dependa de la zona y agregaría un parámetro sin consumidor.

### D9 - Compatibilidad explícita con C-05b

| Necesidad de C-05b | Punto de extensión de C-05 |
|---|---|
| `GET /health` y servidor/ router existentes | `crearServidor` + registro de `GET /health` |
| Registrar `POST /turnos` sin segundo servidor | `rutas: [(router, deps) => registrarRutasTurnos(router, deps)]` |
| Reloj fijo en tests | `ahora` inyectado y expuesto en `deps` |
| Seed de demostración | `iniciarServidor({ repos: reposDemo })`; no se siembra C-01 cuando hay repos |
| Errores `409`/`422`/`400` uniformes | `mapearError` central |
| `/docs` con HTML | contrato de respuesta con string + `Content-Type` propio |
| Puerto efímero y cierre en `t.after` | `puerto: 0` y `cerrar()` idempotente |

C-05b implementa el seed de demostración y las rutas de turnos en módulos nuevos; C-05 no los conoce.

### D10 - Tests E2E deterministas

`tests/http.test.js` usa `node:test`, `fetch` nativo y `t.after`. Cada test arranca con `puerto: 0` y cierra con `cerrar()`. Se cubren: salud, ruta desconocida, `POST /turnos` sin ruta, JSON malformado, ruta inyectada que observa `deps.ahora` y `repos`, mapeo `409`/`422`/`500`, CORS y preflight, puerto inválido y doble cierre. No se modifica ningún test ni archivo de C-01.

## Risks / Trade-offs

- **[Contrato de handler demasiado rígido para C-05b]** → Mitigación: contrato chico y documentado; `deps` + acceso a `req`/`res` cubren JSON, OpenAPI dinámico y HTML sin tocar el servidor.
- **[C-05b necesita parámetros de path antes de C-07]** → Mitigación: C-05b solo usa rutas exactas; C-07 extiende el router cuando agregue `/turnos/:id`.
- **[Cuerpo sin límite de tamaño]** → Riesgo aceptado en desarrollo; el límite y `413` se difieren a C-15/C-16.
- **[CORS `*` sin autenticación]** → Es explícitamente de desarrollo; C-15 lo reemplaza antes de exponer la API.
- **[Cierre con conexiones keep-alive puede colgar tests]** → `cerrar()` usa `closeAllConnections()` cuando está disponible y comparte una única promesa.
- **[El catálogo de errores se desincroniza del dominio]** → Un único `mapearError` con tests por grupo; al agregar códigos, se actualiza en un solo lugar.
- **[El seed por defecto de C-01 se aplica dos veces si C-05b pasa repos parciales]** → Regla explícita: si `repos` se inyecta, C-05 no siembra; C-05b es dueño de su seed.
- **[`TZ` no se usa todavía]** → Documentado; no hay fechas en C-05 y el reloj se inyecta, así que no hay comportamiento dependiente de zona.

## Migration Plan

1. Implementar router, errores, servidor y `src/index.js`.
2. Agregar `tests/http.test.js` y correr `node --test`: C-01 debe seguir en verde y sumarse los tests HTTP.
3. Verificar manualmente `GET /health` en un puerto efímero o en `PORT` definido.
4. Rollback: eliminar los archivos agregados por C-05 y volver al estado de C-01; no hay datos persistidos que migrar.

## Open Questions

- Límite de tamaño del body y código `413`: diferido a C-15/C-16, no cambia el contrato actual.
- Extensión del router con parámetros de path: la resuelve C-07 cuando agregue `GET /turnos/:id`; no bloquea C-05 ni C-05b.
