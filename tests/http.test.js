'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const { crearRouter } = require('../src/infrastructure/http/router');
const { HttpError, mapearError, crearCuerpoError } = require('../src/infrastructure/http/errors');
const { DomainError, CODES } = require('../src/domain/errors');
const { crearRepositorios } = require('../src/infrastructure/repos/inMemoryRepos');
const { iniciarServidor } = require('../src/index');

const LOGGER_SILENCIOSO = { error() {} };
const AHORA = new Date('2026-11-03T12:00:00-03:00');

async function arrancar(t, opciones = {}) {
  const handle = await iniciarServidor({
    puerto: 0,
    logger: LOGGER_SILENCIOSO,
    ...opciones,
  });

  t.after(async () => {
    await handle.cerrar();
  });

  return handle;
}

function moduloConRutas(registrar) {
  return (router, deps) => registrar(router, deps);
}

test('Router: registra y resuelve por método y ruta exacta', () => {
  const router = crearRouter();
  const handler = () => ({ status: 200, body: { ok: true } });

  router.registrar('get', '/prueba', handler);

  assert.equal(router.resolver('GET', '/prueba'), handler);
  assert.equal(router.resolver('POST', '/prueba'), null);
  assert.equal(router.resolver('GET', '/otra-ruta'), null);
});

test('Router: ignora el query string en el matching', () => {
  const router = crearRouter();
  const handler = () => ({ status: 200, body: {} });

  router.registrar('GET', '/health', handler);

  assert.equal(router.resolver('GET', '/health?detalle=1'), handler);
});

test('Router: rechaza el registro duplicado de una ruta', () => {
  const router = crearRouter();
  const handler = () => ({ status: 200, body: {} });

  router.registrar('GET', '/prueba', handler);

  assert.throws(() => router.registrar('GET', '/prueba', handler), /duplicada/i);
});

test('Errores: mapea HttpError de borde', () => {
  assert.deepEqual(mapearError(new HttpError(400, 'DATOS_INVALIDOS', 'mal')), {
    status: 400,
    code: 'DATOS_INVALIDOS',
    message: 'mal',
  });
  assert.deepEqual(mapearError(new HttpError(404, 'RUTA_NO_ENCONTRADA', 'sin ruta')), {
    status: 404,
    code: 'RUTA_NO_ENCONTRADA',
    message: 'sin ruta',
  });
});

test('Errores: mapea 409 y 422 de dominio conservando el código', () => {
  const casos = [
    [new DomainError(CODES.PROFESIONAL_OCUPADO, 'profesional ocupado'), 409, 'PROFESIONAL_OCUPADO'],
    [new DomainError(CODES.SILLON_OCUPADO, 'sillón ocupado'), 409, 'SILLON_OCUPADO'],
    [new DomainError(CODES.PACIENTE_OCUPADO, 'paciente ocupado'), 409, 'PACIENTE_OCUPADO'],
    [new DomainError(CODES.ESTADO_INVALIDO, 'estado inválido'), 409, 'ESTADO_INVALIDO'],
    [new DomainError('FUERA_DE_FRANJA', 'fuera de franja'), 422, 'FUERA_DE_FRANJA'],
    [new DomainError(CODES.FECHA_EN_PASADO, 'fecha pasada'), 422, 'FECHA_EN_PASADO'],
    [new DomainError(CODES.REFERENCIA_INEXISTENTE, 'no existe'), 422, 'REFERENCIA_INEXISTENTE'],
    [new DomainError(CODES.DURACION_INVALIDA, 'duración inválida'), 422, 'DURACION_INVALIDA'],
  ];

  for (const [error, status, code] of casos) {
    const mapeado = mapearError(error);
    assert.equal(mapeado.status, status);
    assert.equal(mapeado.code, code);
    assert.equal(mapeado.message, error.message);
  }
});

test('Errores: un error desconocido no filtra su mensaje interno', () => {
  const mapeado = mapearError(new Error('secreto interno'));

  assert.equal(mapeado.status, 500);
  assert.equal(mapeado.code, 'ERROR_INTERNO');
  assert.equal(mapeado.message, 'Error interno del servidor');
  assert.equal(mapeado.message.includes('secreto'), false);
});

test('Errores: el cuerpo uniforme solo contiene error.code y error.message', () => {
  const cuerpo = crearCuerpoError(mapearError(new DomainError(CODES.FECHA_EN_PASADO, 'fecha pasada')));

  assert.deepEqual(cuerpo, {
    error: { code: 'FECHA_EN_PASADO', message: 'fecha pasada' },
  });
  assert.deepEqual(Object.keys(cuerpo), ['error']);
  assert.deepEqual(Object.keys(cuerpo.error), ['code', 'message']);
});

test('Server: GET /health responde 200 con JSON', async (t) => {
  const handle = await arrancar(t);
  const res = await fetch(`${handle.url}/health`);

  assert.equal(res.status, 200);
  assert.match(res.headers.get('content-type') || '', /application\/json/);
  assert.deepEqual(await res.json(), { status: 'ok' });
});

test('Server: una ruta desconocida responde 404 uniforme', async (t) => {
  const handle = await arrancar(t);
  const res = await fetch(`${handle.url}/ruta-inexistente`);

  assert.equal(res.status, 404);
  const body = await res.json();
  assert.equal(body.error.code, 'RUTA_NO_ENCONTRADA');
  assert.equal(typeof body.error.message, 'string');
});

test('Server: un método no registrado responde 404', async (t) => {
  const handle = await arrancar(t);
  const res = await fetch(`${handle.url}/health`, { method: 'POST' });

  assert.equal(res.status, 404);
  assert.equal((await res.json()).error.code, 'RUTA_NO_ENCONTRADA');
});

test('Server: POST /turnos sin módulo de rutas responde 404 y no crea turnos', async (t) => {
  const repos = crearRepositorios();
  const handle = await arrancar(t, { repos });
  const res = await fetch(`${handle.url}/turnos`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  });

  assert.equal(res.status, 404);
  assert.equal((await res.json()).error.code, 'RUTA_NO_ENCONTRADA');
  assert.equal(repos.turnos.listar().length, 0);
});

test('Server: agrega CORS de desarrollo a las respuestas', async (t) => {
  const handle = await arrancar(t);
  const res = await fetch(`${handle.url}/health`);

  assert.equal(res.headers.get('access-control-allow-origin'), '*');
  assert.match(res.headers.get('access-control-allow-methods') || '', /GET/);
  assert.match(res.headers.get('access-control-allow-methods') || '', /POST/);
  assert.match(res.headers.get('access-control-allow-methods') || '', /OPTIONS/);
  assert.match(res.headers.get('access-control-allow-headers') || '', /Content-Type/i);
});

test('Server: responde preflight OPTIONS con 204 antes del matching', async (t) => {
  const handle = await arrancar(t);
  const res = await fetch(`${handle.url}/turnos`, { method: 'OPTIONS' });

  assert.equal(res.status, 204);
  assert.equal(await res.text(), '');
  assert.equal(res.headers.get('access-control-allow-origin'), '*');
});

test('Server: entrega el JSON parseado y el query al handler', async (t) => {
  const handle = await arrancar(t, {
    rutas: [
      moduloConRutas((router) => {
        router.registrar('POST', '/prueba', ({ body, query }) => ({
          status: 200,
          body: { body, query },
        }));
      }),
    ],
  });

  const res = await fetch(`${handle.url}/prueba?detalle=1`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ok: true }),
  });

  assert.equal(res.status, 200);
  assert.deepEqual(await res.json(), {
    body: { ok: true },
    query: { detalle: '1' },
  });
});

test('Server: un cuerpo vacío llega como objeto vacío', async (t) => {
  const handle = await arrancar(t, {
    rutas: [
      moduloConRutas((router) => {
        router.registrar('POST', '/prueba', ({ body }) => ({ status: 200, body }));
      }),
    ],
  });

  const res = await fetch(`${handle.url}/prueba`, { method: 'POST' });

  assert.equal(res.status, 200);
  assert.deepEqual(await res.json(), {});
});

test('Server: un JSON malformado responde 400 y no ejecuta el handler', async (t) => {
  let ejecutado = false;
  const handle = await arrancar(t, {
    rutas: [
      moduloConRutas((router) => {
        router.registrar('POST', '/prueba', () => {
          ejecutado = true;
          return { status: 200, body: {} };
        });
      }),
    ],
  });

  const res = await fetch(`${handle.url}/prueba`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{',
  });

  assert.equal(res.status, 400);
  assert.equal((await res.json()).error.code, 'DATOS_INVALIDOS');
  assert.equal(ejecutado, false);
});

test('Server: serializa objetos como JSON y respeta el Content-Type de strings', async (t) => {
  const handle = await arrancar(t, {
    rutas: [
      moduloConRutas((router) => {
        router.registrar('GET', '/objeto', () => ({ status: 200, body: { ok: true } }));
        router.registrar('GET', '/texto', () => ({
          status: 200,
          body: 'hola',
          headers: { 'Content-Type': 'text/plain; charset=utf-8' },
        }));
      }),
    ],
  });

  const objeto = await fetch(`${handle.url}/objeto`);
  assert.match(objeto.headers.get('content-type') || '', /application\/json/);
  assert.deepEqual(await objeto.json(), { ok: true });

  const texto = await fetch(`${handle.url}/texto`);
  assert.equal(texto.headers.get('content-type'), 'text/plain; charset=utf-8');
  assert.equal(await texto.text(), 'hola');
});

test('Server: mapea errores de dominio y errores inesperados', async (t) => {
  const handle = await arrancar(t, {
    rutas: [
      moduloConRutas((router) => {
        router.registrar('GET', '/profesional', () => {
          throw new DomainError(CODES.PROFESIONAL_OCUPADO, 'profesional ocupado');
        });
        router.registrar('GET', '/fecha', () => {
          throw new DomainError(CODES.FECHA_EN_PASADO, 'fecha pasada');
        });
        router.registrar('GET', '/datos', () => {
          throw new HttpError(400, 'DATOS_INVALIDOS', 'datos inválidos');
        });
        router.registrar('GET', '/inesperado', () => {
          throw new Error('secreto interno');
        });
      }),
    ],
  });

  const profesional = await fetch(`${handle.url}/profesional`);
  assert.equal(profesional.status, 409);
  assert.equal((await profesional.json()).error.code, 'PROFESIONAL_OCUPADO');

  const fecha = await fetch(`${handle.url}/fecha`);
  assert.equal(fecha.status, 422);
  assert.equal((await fecha.json()).error.code, 'FECHA_EN_PASADO');

  const datos = await fetch(`${handle.url}/datos`);
  assert.equal(datos.status, 400);
  assert.equal((await datos.json()).error.code, 'DATOS_INVALIDOS');

  const inesperado = await fetch(`${handle.url}/inesperado`);
  assert.equal(inesperado.status, 500);
  const cuerpo = await inesperado.json();
  assert.equal(cuerpo.error.code, 'ERROR_INTERNO');
  assert.equal(cuerpo.error.message, 'Error interno del servidor');
  assert.equal(cuerpo.error.message.includes('secreto'), false);
});

test('Arranque: usa puerto efímero y expone las dependencias inyectadas', async (t) => {
  const repos = crearRepositorios();
  const handle = await arrancar(t, {
    repos,
    ahora: () => AHORA,
    rutas: [
      moduloConRutas((router, deps) => {
        router.registrar('GET', '/deps', () => ({
          status: 200,
          body: {
            ahora: deps.ahora().toISOString(),
            mismoRepos: deps.repos === repos,
          },
        }));
      }),
    ],
  });

  assert.ok(handle.puerto > 0);
  assert.equal(handle.puerto, handle.server.address().port);

  const res = await fetch(`${handle.url}/deps`);
  assert.deepEqual(await res.json(), {
    ahora: AHORA.toISOString(),
    mismoRepos: true,
  });
});

test('Puerto: el argumento 0 tiene prioridad sobre PORT', async (t) => {
  const anterior = process.env.PORT;
  process.env.PORT = 'no-es-un-puerto';

  let handle;
  try {
    handle = await iniciarServidor({ puerto: 0, logger: LOGGER_SILENCIOSO });
  } finally {
    if (anterior === undefined) {
      delete process.env.PORT;
    } else {
      process.env.PORT = anterior;
    }
  }

  t.after(async () => {
    await handle.cerrar();
  });

  assert.ok(handle.puerto > 0);
});

test('Puerto: un valor inválido o ausente rechaza el arranque', async () => {
  await assert.rejects(
    () => iniciarServidor({ puerto: 'no-es-un-puerto', logger: LOGGER_SILENCIOSO }),
    /puerto/i,
  );
  await assert.rejects(
    () => iniciarServidor({ puerto: -1, logger: LOGGER_SILENCIOSO }),
    /puerto/i,
  );

  const anterior = process.env.PORT;
  delete process.env.PORT;

  try {
    await assert.rejects(
      () => iniciarServidor({ logger: LOGGER_SILENCIOSO }),
      /PORT|puerto/i,
    );
  } finally {
    if (anterior !== undefined) {
      process.env.PORT = anterior;
    }
  }
});

test('Seed: aplica el seed de C-01 cuando no se inyectan repositorios', async (t) => {
  const handle = await arrancar(t);
  const repos = handle.deps.repos;

  assert.equal(repos.profesionales.listar().length, 2);
  assert.equal(repos.sillones.listar().length, 3);
  assert.equal(repos.prestaciones.listar().length, 4);
  assert.equal(repos.pacientes.listar().length, 2);
  assert.equal(repos.turnos.listar().length, 0);
});

test('Seed: no agrega entidades cuando se inyectan repositorios', async (t) => {
  const repos = crearRepositorios();
  const handle = await arrancar(t, { repos });

  assert.equal(handle.deps.repos.profesionales.listar().length, 0);
  assert.equal(handle.deps.repos.sillones.listar().length, 0);
  assert.equal(handle.deps.repos.prestaciones.listar().length, 0);
  assert.equal(handle.deps.repos.pacientes.listar().length, 0);
  assert.equal(handle.deps.repos.turnos.listar().length, 0);
});

test('Cierre: cerrar es idempotente', async () => {
  const handle = await iniciarServidor({ puerto: 0, logger: LOGGER_SILENCIOSO });

  await handle.cerrar();
  await handle.cerrar();

  assert.equal(handle.server.listening, false);
});

test('Arranque: importar src/index no inicia el servidor', () => {
  const modulo = require('../src/index');

  assert.equal(typeof modulo.iniciarServidor, 'function');
  assert.equal(typeof modulo.resolverPuerto, 'function');
});
