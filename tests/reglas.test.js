'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const { haySolapamiento, derivarFin, validarSinSolapamiento } = require('../src/domain/reglas');
const { CODES } = require('../src/domain/errors');

function turno(profesionalId, sillonId, pacienteId, inicio, fin, estado = 'RESERVADO') {
  return {
    profesionalId,
    sillonId,
    pacienteId,
    fechaHoraInicio: new Date(inicio),
    fechaHoraFin: new Date(fin),
    estado,
  };
}

test('haySolapamiento: bordes contiguos no chocan, solape parcial sí', () => {
  const base = turno('pr1', 's1', 'pa1', '2026-10-20T09:00:00-03:00', '2026-10-20T09:30:00-03:00');
  const contiguo = turno('pr1', 's1', 'pa1', '2026-10-20T09:30:00-03:00', '2026-10-20T10:00:00-03:00');
  const parcial = turno('pr1', 's1', 'pa1', '2026-10-20T09:15:00-03:00', '2026-10-20T09:45:00-03:00');

  assert.equal(haySolapamiento(base, contiguo), false);
  assert.equal(haySolapamiento(base, parcial), true);
});

test('derivarFin suma la duración en minutos (30/40/45/60)', () => {
  const inicio = '2026-10-20T09:00:00-03:00';
  assert.equal(derivarFin(inicio, 30).toISOString(), new Date('2026-10-20T09:30:00-03:00').toISOString());
  assert.equal(derivarFin(inicio, 40).toISOString(), new Date('2026-10-20T09:40:00-03:00').toISOString());
  assert.equal(derivarFin(inicio, 45).toISOString(), new Date('2026-10-20T09:45:00-03:00').toISOString());
  assert.equal(derivarFin(inicio, 60).toISOString(), new Date('2026-10-20T10:00:00-03:00').toISOString());
});

test('validarSinSolapamiento distingue profesional, sillón y paciente', () => {
  const existente = turno('pr1', 's1', 'pa1', '2026-10-20T09:00:00-03:00', '2026-10-20T09:30:00-03:00');
  const candidato = turno('pr1', 's1', 'pa1', '2026-10-20T09:15:00-03:00', '2026-10-20T09:45:00-03:00');
  const existentes = [existente];

  assert.throws(
    () => validarSinSolapamiento(candidato, existentes, 'profesionalId'),
    (err) => err.code === CODES.PROFESIONAL_OCUPADO,
  );
  assert.throws(
    () => validarSinSolapamiento(candidato, existentes, 'sillonId'),
    (err) => err.code === CODES.SILLON_OCUPADO,
  );
  assert.throws(
    () => validarSinSolapamiento(candidato, existentes, 'pacienteId'),
    (err) => err.code === CODES.PACIENTE_OCUPADO,
  );
});

test('validarSinSolapamiento ignora los turnos CANCELADO', () => {
  const cancelado = turno('pr1', 's1', 'pa1', '2026-10-20T09:00:00-03:00', '2026-10-20T09:30:00-03:00', 'CANCELADO');
  const candidato = turno('pr1', 's1', 'pa1', '2026-10-20T09:00:00-03:00', '2026-10-20T09:30:00-03:00');

  assert.doesNotThrow(() => validarSinSolapamiento(candidato, [cancelado], 'profesionalId'));
});
