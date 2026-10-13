'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const { crearRepositorios, sembrar } = require('../src/infrastructure/repos/inMemoryRepos');
const { crearTurnosService } = require('../src/application/turnosService');
const { CODES } = require('../src/domain/errors');

const AHORA = new Date('2026-10-20T08:00:00-03:00');

function nuevoContexto({ ahora = () => AHORA } = {}) {
  const repos = crearRepositorios();
  const seed = sembrar(repos);
  const service = crearTurnosService({ repos, ahora });
  return { repos, seed, service };
}

function reservar(service, seed, overrides = {}) {
  return service.crearTurno({
    pacienteId: seed.pacientes[0].id,
    profesionalId: seed.profesionales[0].id,
    sillonId: seed.sillones[0].id,
    prestacionId: seed.prestaciones[0].id,
    fechaHoraInicio: '2026-10-20T09:00:00-03:00',
    ...overrides,
  });
}

test('Escenario: creación exitosa de un turno', () => {
  const { repos, seed, service } = nuevoContexto();
  const turno = reservar(service, seed);

  assert.equal(turno.estado, 'RESERVADO');
  assert.equal(turno.pacienteId, seed.pacientes[0].id);
  assert.equal(repos.turnos.listar().length, 1);
  assert.equal(repos.turnos.obtenerPorId(turno.id).id, turno.id);
});

test('Escenario: fin derivado de la duración de la prestación', () => {
  const { seed, service } = nuevoContexto();
  const turno = reservar(service, seed, { prestacionId: seed.prestaciones[0].id });

  assert.equal(turno.fechaHoraFin.toISOString(), new Date('2026-10-20T09:30:00-03:00').toISOString());
});

test('Escenario: prestación con duración inválida → DURACION_INVALIDA', () => {
  const { repos, seed, service } = nuevoContexto();
  const rota = repos.prestaciones.guardar({
    id: 'prestacion-rota',
    nombre: 'Rota',
    duracionMinutos: 0,
    activo: true,
  });

  assert.throws(
    () => reservar(service, seed, { prestacionId: rota.id }),
    (err) => err.code === CODES.DURACION_INVALIDA,
  );
});

test('Escenario: profesional ocupado → PROFESIONAL_OCUPADO', () => {
  const { seed, service } = nuevoContexto();
  reservar(service, seed);

  assert.throws(
    () =>
      reservar(service, seed, {
        sillonId: seed.sillones[1].id,
        pacienteId: seed.pacientes[1].id,
        fechaHoraInicio: '2026-10-20T09:15:00-03:00',
      }),
    (err) => err.code === CODES.PROFESIONAL_OCUPADO,
  );
});

test('Escenario: turnos contiguos del mismo profesional no chocan', () => {
  const { seed, service } = nuevoContexto();
  reservar(service, seed, { fechaHoraInicio: '2026-10-20T09:00:00-03:00' });
  const segundo = reservar(service, seed, {
    pacienteId: seed.pacientes[1].id,
    sillonId: seed.sillones[1].id,
    fechaHoraInicio: '2026-10-20T09:30:00-03:00',
  });

  assert.ok(segundo.id);
  assert.equal(segundo.fechaHoraInicio.toISOString(), new Date('2026-10-20T09:30:00-03:00').toISOString());
});

test('Escenario: sillón ocupado → SILLON_OCUPADO', () => {
  const { seed, service } = nuevoContexto();
  reservar(service, seed);

  assert.throws(
    () =>
      reservar(service, seed, {
        profesionalId: seed.profesionales[1].id,
        pacienteId: seed.pacientes[1].id,
        fechaHoraInicio: '2026-10-20T09:15:00-03:00',
      }),
    (err) => err.code === CODES.SILLON_OCUPADO,
  );
});

test('Escenario: sillones distintos permiten reservas en paralelo', () => {
  const { seed, service } = nuevoContexto();
  reservar(service, seed, { sillonId: seed.sillones[0].id });
  const paralelo = reservar(service, seed, {
    profesionalId: seed.profesionales[1].id,
    pacienteId: seed.pacientes[1].id,
    sillonId: seed.sillones[1].id,
    fechaHoraInicio: '2026-10-20T09:00:00-03:00',
  });

  assert.ok(paralelo.id);
});

test('Escenario: paciente con turnos solapados → PACIENTE_OCUPADO', () => {
  const { seed, service } = nuevoContexto();
  reservar(service, seed);

  assert.throws(
    () =>
      reservar(service, seed, {
        profesionalId: seed.profesionales[1].id,
        sillonId: seed.sillones[1].id,
        fechaHoraInicio: '2026-10-20T09:15:00-03:00',
      }),
    (err) => err.code === CODES.PACIENTE_OCUPADO,
  );
});

test('Escenario: paciente con turnos contiguos no choca', () => {
  const { seed, service } = nuevoContexto();
  reservar(service, seed, { fechaHoraInicio: '2026-10-20T09:00:00-03:00' });
  const segundo = reservar(service, seed, {
    profesionalId: seed.profesionales[1].id,
    sillonId: seed.sillones[1].id,
    fechaHoraInicio: '2026-10-20T09:30:00-03:00',
  });

  assert.ok(segundo.id);
});

test('Escenario: fecha en el pasado → FECHA_EN_PASADO', () => {
  const { seed, service } = nuevoContexto();

  assert.throws(
    () => reservar(service, seed, { fechaHoraInicio: '2026-10-19T09:00:00-03:00' }),
    (err) => err.code === CODES.FECHA_EN_PASADO,
  );
});

test('Escenario: inicio igual o posterior a ahora es válido', () => {
  const { seed, service } = nuevoContexto({ ahora: () => new Date('2026-10-20T09:00:00-03:00') });
  const turno = reservar(service, seed, { fechaHoraInicio: '2026-10-20T09:00:00-03:00' });

  assert.ok(turno.id);
});

test('Escenario: turno cancelado no bloquea el horario', () => {
  const { repos, seed, service } = nuevoContexto();
  const primero = reservar(service, seed);
  repos.turnos.guardar({ ...primero, estado: 'CANCELADO' });

  const segundo = reservar(service, seed);
  assert.ok(segundo.id);
  assert.notEqual(primero.id, segundo.id);
});

test('Escenario: referencia inexistente → REFERENCIA_INEXISTENTE', () => {
  const { seed, service } = nuevoContexto();

  assert.throws(
    () => reservar(service, seed, { profesionalId: 'no-existe' }),
    (err) => err.code === CODES.REFERENCIA_INEXISTENTE,
  );
  assert.throws(
    () => reservar(service, seed, { sillonId: 'no-existe' }),
    (err) => err.code === CODES.REFERENCIA_INEXISTENTE,
  );
  assert.throws(
    () => reservar(service, seed, { prestacionId: 'no-existe' }),
    (err) => err.code === CODES.REFERENCIA_INEXISTENTE,
  );
  assert.throws(
    () => reservar(service, seed, { pacienteId: 'no-existe' }),
    (err) => err.code === CODES.REFERENCIA_INEXISTENTE,
  );
});

test('Escenario: los códigos de error son distinguibles entre sí', () => {
  const { seed, service } = nuevoContexto();
  reservar(service, seed);

  const codigo = (overrides) => {
    try {
      reservar(service, seed, overrides);
      return null;
    } catch (err) {
      return err.code;
    }
  };

  const profesional = codigo({ sillonId: seed.sillones[1].id, pacienteId: seed.pacientes[1].id, fechaHoraInicio: '2026-10-20T09:15:00-03:00' });
  const pasado = codigo({ fechaHoraInicio: '2026-10-19T09:00:00-03:00' });
  const inexistente = codigo({ pacienteId: 'no-existe' });

  assert.equal(profesional, CODES.PROFESIONAL_OCUPADO);
  assert.equal(pasado, CODES.FECHA_EN_PASADO);
  assert.equal(inexistente, CODES.REFERENCIA_INEXISTENTE);
  assert.notEqual(profesional, pasado);
  assert.notEqual(pasado, inexistente);
});
