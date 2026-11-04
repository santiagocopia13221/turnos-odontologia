# Spec Delta

## Purpose

Proveer la base HTTP del sistema: un servidor nativo, un router extensible, parseo de JSON, respuestas y errores uniformes, y un arranque inyectable que permita a los changes posteriores registrar sus rutas sin duplicar infraestructura.

## ADDED Requirements

### Requirement: Arranque y cierre del servidor

El sistema SHALL exponer una función de arranque que cree un servidor HTTP nativo y comience a escuchar en el puerto indicado, aceptando `0` como puerto efímero. SHALL aceptar repositorios, reloj y módulos de rutas inyectados. El handle devuelto SHALL exponer el puerto real y una función `cerrar()` idempotente que detenga el servidor y resuelva cuando el cierre terminó.

#### Scenario: Puerto efímero

- **WHEN** se arranca el servidor con puerto `0`
- **THEN** el servidor escucha en un puerto mayor que cero y el handle devuelve ese mismo puerto real

#### Scenario: Cierre limpio e idempotente

- **WHEN** se invoca `cerrar()` sobre un servidor en ejecución y luego se lo invoca de nuevo
- **THEN** el servidor deja de aceptar conexiones, la primera llamada resuelve cuando terminó el cierre y la segunda no produce error

#### Scenario: Dependencias inyectadas disponibles para las rutas

- **WHEN** se arranca el servidor con repositorios, un reloj y un módulo de rutas inyectados
- **THEN** el módulo de rutas recibe esas mismas dependencias y una ruta de prueba puede observar el valor del reloj inyectado

### Requirement: Puerto configurable sin valores hardcodeados

El arranque SHALL usar el puerto recibido como argumento y, si se omite, SHALL leerlo de la variable de entorno `PORT`. NO DEBE usar un puerto fijo escrito en el código. Si no hay un puerto válido disponible, SHALL fallar con un error de configuración antes de escuchar.

#### Scenario: El argumento tiene prioridad sobre el entorno

- **WHEN** se arranca con el argumento `0` mientras `PORT` tiene otro valor
- **THEN** el servidor usa un puerto efímero y no el valor de `PORT`

#### Scenario: Puerto ausente o inválido

- **WHEN** no se recibe un puerto válido por argumento ni por `PORT`
- **THEN** el arranque falla con un error de configuración y no queda un servidor escuchando

### Requirement: Endpoint de salud

El sistema SHALL exponer `GET /health` sin autenticación. La respuesta SHALL ser `200` con `Content-Type` JSON y cuerpo `{ "status": "ok" }`.

#### Scenario: Consulta de salud

- **WHEN** se solicita `GET /health`
- **THEN** responde `200` con `Content-Type` JSON y cuerpo `{ "status": "ok" }`

### Requirement: Router extensible por método y ruta

El sistema SHALL resolver solicitudes comparando el método HTTP y la ruta exacta, ignorando el query string para el matching. SHALL permitir registrar módulos de rutas sobre la misma instancia del servidor, sin crear un segundo servidor. Los módulos de rutas SHALL poder recibir las dependencias inyectadas en el arranque.

#### Scenario: Ruta inyectada responde

- **WHEN** se arranca el servidor con un módulo que registra `GET /prueba` y se solicita esa ruta
- **THEN** la solicitud es atendida por el handler inyectado y no responde `404`

#### Scenario: Query string no afecta el matching

- **WHEN** se solicita `GET /health?detalle=1`
- **THEN** la solicitud se resuelve contra `GET /health` y responde `200`

### Requirement: Rutas no registradas

Una solicitud cuya combinación de método y ruta no esté registrada SHALL responder `404` con código `RUTA_NO_ENCONTRADA` y el cuerpo de error uniforme. C-05 NO DEBE registrar rutas de turnos ni de otros recursos de dominio.

#### Scenario: Ruta desconocida

- **WHEN** se solicita `GET /ruta-inexistente`
- **THEN** responde `404` con `error.code = RUTA_NO_ENCONTRADA`

#### Scenario: Método no registrado para una ruta existente

- **WHEN** se solicita `POST /health`, que no está registrado
- **THEN** responde `404` con `error.code = RUTA_NO_ENCONTRADA`

#### Scenario: Sin rutas de turnos en C-05

- **WHEN** se solicita `POST /turnos` sin haber inyectado un módulo de rutas de turnos
- **THEN** responde `404` con `error.code = RUTA_NO_ENCONTRADA` y no se crea ningún turno

### Requirement: Parseo del cuerpo JSON

El sistema SHALL leer el cuerpo de las solicitudes que lo incluyan y parsearlo como JSON antes de invocar al handler. Un cuerpo vacío SHALL entregarse como objeto vacío. Si el cuerpo no vacío no es JSON válido, SHALL responder `400` con código `DATOS_INVALIDOS` y NO DEBE invocar al handler.

#### Scenario: Cuerpo JSON válido

- **WHEN** se envía `POST /prueba` con un cuerpo JSON válido a una ruta inyectada
- **THEN** el handler recibe el objeto parseado y responde con el resultado esperado

#### Scenario: Cuerpo JSON malformado

- **WHEN** se envía una solicitud con un cuerpo que no es JSON válido
- **THEN** responde `400` con `error.code = DATOS_INVALIDOS` y el handler no se ejecuta

### Requirement: Respuestas JSON

El sistema SHALL serializar como JSON los cuerpos de respuesta que sean objetos o arrays y SHALL fijar `Content-Type: application/json; charset=utf-8`. Cuando un handler devuelva un cuerpo de texto y encabezados propios, SHALL respetar esos encabezados para permitir respuestas no JSON.

#### Scenario: Cuerpo de objeto serializado

- **WHEN** un handler devuelve un objeto como cuerpo con estado `200`
- **THEN** la respuesta tiene `Content-Type` JSON y el cuerpo es el objeto serializado

#### Scenario: Cuerpo de texto con encabezados propios

- **WHEN** un handler devuelve un cuerpo de texto con `Content-Type` propio
- **THEN** la respuesta conserva el `Content-Type` indicado por el handler

### Requirement: Manejo central y uniforme de errores

Toda respuesta de error SHALL incluir un cuerpo JSON con `error.code` estable y `error.message` legible; el status HTTP NO DEBE reemplazar al código. El servidor SHALL traducir los errores de dominio catalogados a `409` para solapamientos, `422` para valores semánticamente inválidos y `400` para datos inválidos. Un error no controlado SHALL responder `500` con código `ERROR_INTERNO` sin exponer detalles internos.

#### Scenario: Solapamiento de dominio

- **WHEN** un handler lanza un error de dominio con código `PROFESIONAL_OCUPADO`, `SILLON_OCUPADO` o `PACIENTE_OCUPADO`
- **THEN** responde `409` conservando ese código en `error.code`

#### Scenario: Error semántico de dominio

- **WHEN** un handler lanza un error de dominio con código `FUERA_DE_FRANJA`, `FECHA_EN_PASADO`, `REFERENCIA_INEXISTENTE` o `DURACION_INVALIDA`
- **THEN** responde `422` conservando ese código en `error.code`

#### Scenario: Error no controlado

- **WHEN** un handler lanza un error que no es de dominio ni de la capa HTTP
- **THEN** responde `500` con `error.code = ERROR_INTERNO` y un mensaje genérico que no revela el detalle interno

### Requirement: CORS mínimo de desarrollo

El sistema SHALL agregar encabezados CORS de desarrollo a las respuestas: origen `*`, métodos `GET, POST, OPTIONS` y encabezado `Content-Type`. SHALL responder los preflight `OPTIONS` con `204` y sin cuerpo, antes de resolver la ruta solicitada.

#### Scenario: Encabezados CORS en una respuesta

- **WHEN** se solicita `GET /health`
- **THEN** la respuesta incluye `Access-Control-Allow-Origin: *` y los métodos y encabezados permitidos

#### Scenario: Preflight sin ruta registrada

- **WHEN** se envía `OPTIONS /turnos` sin que exista una ruta registrada para ese path
- **THEN** responde `204` sin cuerpo e incluye los encabezados CORS
