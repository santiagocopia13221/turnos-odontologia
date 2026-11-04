'use strict';

const http = require('node:http');

const { crearRouter } = require('./router');
const { HttpError, mapearError, crearCuerpoError } = require('./errors');

const CORS_HEADERS = Object.freeze({
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
});

function aplicarCors(res) {
  for (const [nombre, valor] of Object.entries(CORS_HEADERS)) {
    res.setHeader(nombre, valor);
  }
}

function tieneContentType(headers) {
  return Object.keys(headers).some((nombre) => nombre.toLowerCase() === 'content-type');
}

function leerBody(req) {
  return new Promise((resolve, reject) => {
    let datos = '';

    req.setEncoding('utf8');
    req.on('data', (chunk) => {
      datos += chunk;
    });
    req.on('end', () => {
      if (datos.trim() === '') {
        resolve({});
        return;
      }

      try {
        resolve(JSON.parse(datos));
      } catch {
        reject(new HttpError(400, 'DATOS_INVALIDOS', 'El cuerpo de la solicitud no es JSON válido'));
      }
    });
    req.on('error', reject);
  });
}

function enviarRespuesta(res, resultado = {}) {
  if (res.writableEnded) {
    return;
  }

  const { status = 200, body = null, headers = {} } = resultado || {};
  const encabezados = { ...headers };

  if (body === null || body === undefined) {
    res.statusCode = status;
    for (const [nombre, valor] of Object.entries(encabezados)) {
      res.setHeader(nombre, valor);
    }
    res.end();
    return;
  }

  if (Buffer.isBuffer(body)) {
    if (!tieneContentType(encabezados)) {
      encabezados['Content-Type'] = 'application/octet-stream';
    }
    res.statusCode = status;
    for (const [nombre, valor] of Object.entries(encabezados)) {
      res.setHeader(nombre, valor);
    }
    res.end(body);
    return;
  }

  if (typeof body === 'string') {
    if (!tieneContentType(encabezados)) {
      encabezados['Content-Type'] = 'text/plain; charset=utf-8';
    }
    res.statusCode = status;
    for (const [nombre, valor] of Object.entries(encabezados)) {
      res.setHeader(nombre, valor);
    }
    res.end(body);
    return;
  }

  if (!tieneContentType(encabezados)) {
    encabezados['Content-Type'] = 'application/json; charset=utf-8';
  }
  res.statusCode = status;
  for (const [nombre, valor] of Object.entries(encabezados)) {
    res.setHeader(nombre, valor);
  }
  res.end(JSON.stringify(body));
}

function manejarError(error, res, logger) {
  const mapeado = mapearError(error);

  if (mapeado.status >= 500 && logger && typeof logger.error === 'function') {
    logger.error(error);
  }

  enviarRespuesta(res, {
    status: mapeado.status,
    body: crearCuerpoError(mapeado),
  });
}

async function manejarSolicitud(req, res, { router, deps }) {
  aplicarCors(res);

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }

  const url = new URL(req.url, 'http://localhost');
  const handler = router.resolver(req.method, url.pathname);

  if (!handler) {
    throw new HttpError(
      404,
      'RUTA_NO_ENCONTRADA',
      `Ruta no encontrada: ${req.method} ${url.pathname}`,
    );
  }

  const body = await leerBody(req);
  const query = Object.fromEntries(url.searchParams.entries());
  const resultado = await handler({ req, res, body, query, deps });

  enviarRespuesta(res, resultado);
}

/**
 * Crea el servidor HTTP base y registra únicamente GET /health.
 * Las rutas de dominio se agregan desde módulos inyectados por el arranque.
 */
function crearServidor({ repos, ahora = () => new Date(), logger = console } = {}) {
  const router = crearRouter();
  const deps = { repos, ahora, logger };

  router.registrar('GET', '/health', () => ({
    status: 200,
    body: { status: 'ok' },
  }));

  const server = http.createServer((req, res) => {
    manejarSolicitud(req, res, { router, deps }).catch((error) => {
      manejarError(error, res, logger);
    });
  });

  return { server, router, deps };
}

module.exports = { crearServidor, CORS_HEADERS };
