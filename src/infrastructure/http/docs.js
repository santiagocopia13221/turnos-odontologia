'use strict';

const SWAGGER_UI_VERSION = '5.11.0';
const SWAGGER_UI_BASE = `https://unpkg.com/swagger-ui-dist@${SWAGGER_UI_VERSION}`;

/**
 * Página estática de documentación. Swagger UI se carga desde unpkg con la
 * versión exacta 5.11.0; no se usa el preset standalone ni paquetes npm.
 */
function crearPaginaDocs() {
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="description" content="Documentación de la API mínima de turnos" />
  <title>API mínima de turnos - Swagger UI</title>
  <link rel="stylesheet" href="${SWAGGER_UI_BASE}/swagger-ui.css" />
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="${SWAGGER_UI_BASE}/swagger-ui-bundle.js" crossorigin></script>
  <script>
    window.onload = () => {
      window.ui = SwaggerUIBundle({
        url: '/openapi.json',
        dom_id: '#swagger-ui',
      });
    };
  </script>
</body>
</html>
`;
}

module.exports = { crearPaginaDocs, SWAGGER_UI_VERSION };
