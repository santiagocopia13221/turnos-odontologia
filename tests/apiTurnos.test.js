'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const { crearRepositorios } = require('../src/infrastructure/repos/inMemoryRepos');
const { sembrarDemo, IDS_DEMO } = require('../src/infrastructure/repos/demoSeed');
const { iniciarServidor } = require('../src/index');
const { registrarRutasTurnos } = require('../src/infrastructure/http/rutasTurnos');

const AHORA = new Date('2026-11-03T12:00:00-03:00');
const LOGGER_SILENCIOSO = { error() {} };
const ISO_UTC = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;

function crearReposDemo() {
  const repos = crearRepositorios();
  sembrarDemo(repos);
  return repos;
}

async function arrancar(t, opciones = {}) {
  const {
    repos = crearReposDemo(),
    ahora = () => AHORA,
    rutas = [registrarRutasTurnos],
    ...resto
  } = opciones;

  const handle = await iniciarServidor({
    puerto: 0,
    logger: LOGGER_SILENCIOSO,
    ahora,
    rutas,
    ...resto,
    repos,
  });

  t.after(async () => {
    await handle.cerrar();
  });

  return handle;
}

function turnoValido(overrides = {}) {
  return {
    pacienteId: IDS_DEMO.paciente,
    profesionalId: IDS_DEMO.profesional,
    sillonId: IDS_DEMO.sillon,
    prestacionId: IDS_DEMO.prestacion,
    fechaHoraInicio: '2026-11-10T09:00:00-03:00',
    ...overrides,
  };
}

function sinCampo(campo) {
  const body = turnoValido();
  delete body[campo];
  return body;
}

function postTurno(handle, body) {
  return fetch(`${handle.url}/turnos`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

function postTurnoCrudo(handle, body) {
  return fetch(`${handle.url}/turnos`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
  });
}

async function crearTurnoOk(handle, overrides = {}) {
  const res = await postTurno(handle, turnoValido(overrides));
  assert.equal(res.status, 201);
  return (await res.json()).turno;
}

async function esperarError(res, status, code) {
  assert.equal(res.status, status);
  const body = await res.json();
  assert.equal(body.error.code, code);
  assert.equal(typeof body.error.message, 'string');
  return body;
}

test('Seed demo: IDs estables, datos ficticios y cantidades', async (t) => {
  const handle = await arrancar(t);
  const repos = handle.deps.repos;

  assert.equal(repos.profesionales.obtenerPorId(IDS_DEMO.profesional).nombre, 'Dr. Demo Uno');
  assert.equal(repos.sillones.obtenerPorId(IDS_DEMO.sillon).nombre, 'Sillón Demo 1');
  assert.equal(repos.prestaciones.obtenerPorId(IDS_DEMO.prestacion).duracionMinutos, 30);
  assert.equal(repos.pacientes.obtenerPorId(IDS_DEMO.paciente).nombre, 'Ana Demo');

  assert.equal(repos.profesionales.listar().length, 2);
  assert.equal(repos.sillones.listar().length, 3);
  assert.equal(repos.prestaciones.listar().length, 4);
  assert.equal(repos.pacientes.listar().length, 2);
  assert.equal(repos.turnos.listar().length, 0);
});

test('GET /health sigue respondiendo en el servidor demo', async (t) => {
  const handle = await arrancar(t);
  const res = await fetch(`${handle.url}/health`);

  assert.equal(res.status, 200);
  assert.deepEqual(await res.json(), { status: 'ok' });
});

test('POST /turnos: reserva exitosa con reloj inyectado', async (t) => {
  const handle = await arrancar(t);
  const res = await postTurno(handle, turnoValido());

  assert.equal(res.status, 201);
  const body = await res.json();
  const turno = body.turno;

  assert.ok(turno.id);
  assert.equal(turno.estado, 'RESERVADO');
  assert.equal(turno.canalReserva, 'ONLINE');
  assert.equal(turno.pacienteId, IDS_DEMO.paciente);
  assert.equal(turno.profesionalId, IDS_DEMO.profesional);
  assert.equal(turno.sillonId, IDS_DEMO.sillon);
  assert.equal(turno.prestacionId, IDS_DEMO.prestacion);
  assert.equal(turno.fechaHoraInicio, '2026-11-10T12:00:00.000Z');
  assert.equal(turno.fechaHoraFin, '2026-11-10T12:30:00.000Z');
  assert.match(turno.fechaHoraInicio, ISO_UTC);
  assert.match(turno.fechaHoraFin, ISO_UTC);
  assert.match(turno.creadoEn, ISO_UTC);
  assert.match(turno.actualizadoEn, ISO_UTC);
  assert.equal(handle.deps.repos.turnos.listar().length, 1);
});

test('POST /turnos: acepta canal RECEPCION', async (t) => {
  const handle = await arrancar(t);
  const res = await postTurno(handle, turnoValido({ canalReserva: 'RECEPCION' }));

  assert.equal(res.status, 201);
  assert.equal((await res.json()).turno.canalReserva, 'RECEPCION');
});

test('POST /turnos: JSON malformado responde 400 y no crea turno', async (t) => {
  const handle = await arrancar(t);
  const res = await postTurnoCrudo(handle, '{');

  await esperarError(res, 400, 'DATOS_INVALIDOS');
  assert.equal(handle.deps.repos.turnos.listar().length, 0);
});

test('POST /turnos: valida campos, tipos, fecha, canal y duración manual', async (t) => {
  const handle = await arrancar(t);
  const casos = [
    ['falta pacienteId', sinCampo('pacienteId')],
    ['falta sillonId', sinCampo('sillonId')],
    ['falta prestacionId', sinCampo('prestacionId')],
    ['falta fechaHoraInicio', sinCampo('fechaHoraInicio')],
    ['pacienteId con tipo incorrecto', turnoValido({ pacienteId: 123 })],
    ['fecha sin offset', turnoValido({ fechaHoraInicio: '2026-11-10T10:00:00' })],
    ['fecha inválida', turnoValido({ fechaHoraInicio: 'no-es-una-fecha' })],
    ['fecha fuera de rango', turnoValido({ fechaHoraInicio: '2026-02-31T10:00:00-03:00' })],
    ['canal inválido', turnoValido({ canalReserva: 'TELEFONO' })],
    ['duración enviada por el cliente', turnoValido({ duracionMinutos: 30 })],
  ];

  for (const [nombre, body] of casos) {
    const res = await postTurno(handle, body);
    assert.equal(res.status, 400, nombre);
    const error = await res.json();
    assert.equal(error.error.code, 'DATOS_INVALIDOS', nombre);
  }

  assert.equal(handle.deps.repos.turnos.listar().length, 0);
});

test('POST /turnos: profesional ocupado responde 409', async (t) => {
  const handle = await arrancar(t);
  await crearTurnoOk(handle, { fechaHoraInicio: '2026-11-10T09:00:00-03:00' });

  const res = await postTurno(
    handle,
    turnoValido({
      sillonId: IDS_DEMO.sillonAlternativo,
      pacienteId: IDS_DEMO.pacienteAlternativo,
      fechaHoraInicio: '2026-11-10T09:15:00-03:00',
    }),
  );

  await esperarError(res, 409, 'PROFESIONAL_OCUPADO');
});

test('POST /turnos: sillón ocupado responde 409 y no reasigna', async (t) => {
  const handle = await arrancar(t);
  await crearTurnoOk(handle, { fechaHoraInicio: '2026-11-10T09:00:00-03:00' });

  const res = await postTurno(
    handle,
    turnoValido({
      profesionalId: IDS_DEMO.profesionalAlternativo,
      pacienteId: IDS_DEMO.pacienteAlternativo,
      fechaHoraInicio: '2026-11-10T09:15:00-03:00',
    }),
  );

  await esperarError(res, 409, 'SILLON_OCUPADO');
  assert.equal(handle.deps.repos.turnos.listar().length, 1);
});

test('POST /turnos: paciente ocupado responde 409', async (t) => {
  const handle = await arrancar(t);
  await crearTurnoOk(handle, { fechaHoraInicio: '2026-11-10T09:00:00-03:00' });

  const res = await postTurno(
    handle,
    turnoValido({
      profesionalId: IDS_DEMO.profesionalAlternativo,
      sillonId: IDS_DEMO.sillonAlternativo,
      fechaHoraInicio: '2026-11-10T09:15:00-03:00',
    }),
  );

  await esperarError(res, 409, 'PACIENTE_OCUPADO');
});

test('POST /turnos: conflicto simultáneo prioriza PROFESIONAL_OCUPADO', async (t) => {
  const handle = await arrancar(t);
  await crearTurnoOk(handle, { fechaHoraInicio: '2026-11-10T09:00:00-03:00' });

  const res = await postTurno(
    handle,
    turnoValido({ fechaHoraInicio: '2026-11-10T09:15:00-03:00' }),
  );

  await esperarError(res, 409, 'PROFESIONAL_OCUPADO');
});

test('POST /turnos: contigüidad por sillón responde 201', async (t) => {
  const handle = await arrancar(t);
  await crearTurnoOk(handle, { fechaHoraInicio: '2026-11-10T12:00:00-03:00' });

  const res = await postTurno(
    handle,
    turnoValido({
      profesionalId: IDS_DEMO.profesionalAlternativo,
      pacienteId: IDS_DEMO.pacienteAlternativo,
      fechaHoraInicio: '2026-11-10T12:30:00-03:00',
    }),
  );

  assert.equal(res.status, 201);
  assert.equal((await res.json()).turno.sillonId, IDS_DEMO.sillon);
});

test('POST /turnos: contigüidad por paciente responde 201', async (t) => {
  const handle = await arrancar(t);
  await crearTurnoOk(handle, { fechaHoraInicio: '2026-11-10T12:00:00-03:00' });

  const res = await postTurno(
    handle,
    turnoValido({
      profesionalId: IDS_DEMO.profesionalAlternativo,
      sillonId: IDS_DEMO.sillonAlternativo,
      fechaHoraInicio: '2026-11-10T12:30:00-03:00',
    }),
  );

  assert.equal(res.status, 201);
  assert.equal((await res.json()).turno.pacienteId, IDS_DEMO.paciente);
});

test('POST /turnos: referencia inexistente responde 422', async (t) => {
  const handle = await arrancar(t);
  const res = await postTurno(
    handle,
    turnoValido({ profesionalId: 'prof-inexistente' }),
  );

  await esperarError(res, 422, 'REFERENCIA_INEXISTENTE');
});

test('POST /turnos: fecha en el pasado responde 422', async (t) => {
  const handle = await arrancar(t);
  const res = await postTurno(
    handle,
    turnoValido({ fechaHoraInicio: '2026-11-03T11:59:59-03:00' }),
  );

  await esperarError(res, 422, 'FECHA_EN_PASADO');
});

test('POST /turnos: duración inválida de la prestación responde 422', async (t) => {
  const repos = crearReposDemo();
  repos.prestaciones.guardar({
    id: 'prestacion-invalida',
    nombre: 'Prestación inválida',
    duracionMinutos: 0,
    activo: true,
  });
  const handle = await arrancar(t, { repos });

  const res = await postTurno(
    handle,
    turnoValido({ prestacionId: 'prestacion-invalida' }),
  );

  await esperarError(res, 422, 'DURACION_INVALIDA');
});

test('POST /turnos: error inesperado responde 500 sin filtrar detalle', async (t) => {
  const repos = crearReposDemo();
  repos.turnos.listar = () => {
    throw new Error('secreto interno');
  };
  const handle = await arrancar(t, { repos });

  const res = await postTurno(handle, turnoValido());

  const body = await esperarError(res, 500, 'ERROR_INTERNO');
  assert.equal(body.error.message, 'Error interno del servidor');
  assert.equal(body.error.message.includes('secreto'), false);
});

test('GET /openapi.json: publica contrato, respuestas y ejemplo futuro', async (t) => {
  const handle = await arrancar(t);
  const res = await fetch(`${handle.url}/openapi.json`);

  assert.equal(res.status, 200);
  assert.match(res.headers.get('content-type') || '', /application\/json/);

  const doc = await res.json();
  assert.equal(doc.openapi, '3.0.3');

  const post = doc.paths['/turnos'].post;
  assert.ok(post);
  for (const codigo of ['201', '400', '409', '422', '500']) {
    assert.ok(post.responses[codigo], `falta la respuesta ${codigo}`);
  }

  const ejemplo = post.requestBody.content['application/json'].example;
  assert.equal(ejemplo.pacienteId, IDS_DEMO.paciente);
  assert.equal(ejemplo.profesionalId, IDS_DEMO.profesional);
  assert.equal(ejemplo.sillonId, IDS_DEMO.sillon);
  assert.equal(ejemplo.prestacionId, IDS_DEMO.prestacion);
  assert.equal(ejemplo.fechaHoraInicio, '2026-11-04T10:00:00-03:00');
  assert.ok(new Date(ejemplo.fechaHoraInicio).getTime() > AHORA.getTime());

  const schema = doc.components.schemas.TurnoCreateRequest;
  assert.equal(schema.properties.pacienteId.example, IDS_DEMO.paciente);
  assert.equal(schema.properties.profesionalId.example, IDS_DEMO.profesional);
  assert.equal(schema.properties.sillonId.example, IDS_DEMO.sillon);
  assert.equal(schema.properties.prestacionId.example, IDS_DEMO.prestacion);
});

test('GET /docs: sirve Swagger UI 5.11.0 sin preset standalone', async (t) => {
  const handle = await arrancar(t);
  const res = await fetch(`${handle.url}/docs`);

  assert.equal(res.status, 200);
  assert.match(res.headers.get('content-type') || '', /text\/html/);

  const html = await res.text();
  assert.match(html, /swagger-ui-dist@5\.11\.0\/swagger-ui\.css/);
  assert.match(html, /swagger-ui-dist@5\.11\.0\/swagger-ui-bundle\.js/);
  assert.match(html, /SwaggerUIBundle/);
  assert.match(html, /url: '\/openapi\.json'/);
  assert.equal(/swagger-ui-standalone-preset/.test(html), false);
});

test('Ejemplo documentado: se ejecuta y devuelve fechas UTC exactas', async (t) => {
  const handle = await arrancar(t);
  const openapi = await (await fetch(`${handle.url}/openapi.json`)).json();
  const ejemplo = openapi.paths['/turnos'].post.requestBody.content['application/json'].example;

  const res = await postTurno(handle, ejemplo);

  assert.equal(res.status, 201);
  const turno = (await res.json()).turno;
  assert.equal(turno.fechaHoraInicio, '2026-11-04T13:00:00.000Z');
  assert.equal(turno.fechaHoraFin, '2026-11-04T13:30:00.000Z');
  assert.equal(turno.pacienteId, IDS_DEMO.paciente);
  assert.equal(turno.profesionalId, IDS_DEMO.profesional);
  assert.equal(turno.sillonId, IDS_DEMO.sillon);
  assert.equal(turno.prestacionId, IDS_DEMO.prestacion);
});

test('Ruta desconocida sigue respondiendo 404', async (t) => {
  const handle = await arrancar(t);
  const res = await fetch(`${handle.url}/ruta-desconocida`);

  await esperarError(res, 404, 'RUTA_NO_ENCONTRADA');
});
