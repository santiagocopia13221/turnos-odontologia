# Evidencia MCP Context7 — Implementación C-05b

## Solicitud

Confirmar los archivos y la forma de inicialización de `SwaggerUIBundle` para servir `GET /docs` con Swagger UI desde unpkg, usando la versión exacta `5.11.0`, apuntando a `/openapi.json` y sin el preset standalone (D8).

## Herramientas MCP usadas

### 1. `context7_resolve-library-id`

**Parámetros:**

- `libraryName`: `Swagger UI`
- `query`: `Swagger UI initialization SwaggerUIBundle with swagger-ui-dist CDN files and OpenAPI URL`

**Resumen de la respuesta:**

Context7 devolvió varias coincidencias. Se seleccionó la librería oficial `/swagger-api/swagger-ui` (reputación `High`, 396 fragmentos de código), adecuada para confirmar la inicialización de Swagger UI y el uso de `swagger-ui-dist`.

### 2. `context7_query-docs`

**Parámetros:**

- `libraryId`: `/swagger-api/swagger-ui`
- `language`: `HTML`
- `query`: `Initialize SwaggerUIBundle in a static HTML page using swagger-ui-dist CDN, swagger-ui.css and swagger-ui-bundle.js, no standalone preset, loading /openapi.json`

**Resumen de la respuesta:**

La documentación de instalación muestra una página HTML básica que:

- carga `https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui.css`;
- carga `https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui-bundle.js`;
- inicializa `SwaggerUIBundle({ url, dom_id: '#swagger-ui' })` dentro de `window.onload`.

El ejemplo básico no usa `swagger-ui-standalone-preset.js`. La documentación de `swagger-ui-dist` confirma que el preset standalone existe como archivo separado, pero no es necesario para esta página.

## Uso en el código

- `src/infrastructure/http/docs.js`: implementa la página `/docs` con la versión exacta `5.11.0`, los archivos `swagger-ui.css` y `swagger-ui-bundle.js`, la URL `/openapi.json` y la inicialización de `SwaggerUIBundle`. No incluye el preset standalone.
- `tests/apiTurnos.test.js`: verifica la versión exacta, ambos archivos CDN, `SwaggerUIBundle`, la URL `/openapi.json` y la ausencia de `swagger-ui-standalone-preset`.
- `openspec/changes/c-05b-api-minima-turnos-openapi/design.md` (D8): decisión de servir Swagger UI por CDN con la versión exacta `5.11.0` y sin preset standalone.

## Datos y secretos

Solo se usaron datos ficticios del seed de demostración (`prof-1`, `sillon-1`, `prestacion-consulta`, `paciente-ana`). No se incluyeron secretos, tokens ni credenciales.
