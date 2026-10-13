'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const { DomainError, CODES } = require('../src/domain/errors');
const {
  crearProfesional,
  crearSillon,
  crearPrestacion,
  crearPaciente,
} = require('../src/domain/entidades');
const { crearTurno } = require('../src/domain/turno');

test('DomainError expone un code estable y distinguible', () => {
  const ocupado = new DomainError(CODES.PROFESIONAL_OCUPADO, 'ocupado');
  const pasado = new DomainError(CODES.FECHA_EN_PASADO, 'pasado');

  assert.ok(ocupado instanceof Error);
  assert.equal(ocupado.name, 'DomainError');
  assert.equal(ocupado.code, 'PROFESIONAL_OCUPADO');
  assert.equal(pasado.code, 'FECHA_EN_PASADO');
  assert.notEqual(ocupado.code, pasado.code);
});

test('Prestacion rechaza duracionMinutos <= 0 con code DURACION_INVALIDA', () => {
  assert.throws(
    () => crearPrestacion({ nombre: 'Mala', duracionMinutos: 0 }),
    (err) => err instanceof DomainError && err.code === CODES.DURACION_INVALIDA,
  );
  assert.throws(
    () => crearPrestacion({ nombre: 'Mala', duracionMinutos: -10 }),
    (err) => err.code === CODES.DURACION_INVALIDA,
  );
});

test('Las entidades se construyen con id generado y defaults', () => {
  const profesional = crearProfesional({ nombre: 'Dr. Test' });
  const sillon = crearSillon({ nombre: 'Sillón Test' });
  const paciente = crearPaciente({ nombre: 'Paciente Test', telefono: '+5491100000000' });

  assert.ok(profesional.id && profesional.activo === true);
  assert.ok(sillon.id && sillon.activo === true);
  assert.ok(paciente.id && paciente.telefono === '+5491100000000');
});

test('crearTurno (entidad) deriva fechaHoraFin y fija estado RESERVADO', () => {
  const turno = crearTurno({
    pacienteId: 'pac',
    profesionalId: 'pro',
    sillonId: 'sil',
    prestacionId: 'pre',
    fechaHoraInicio: '2026-10-20T09:00:00-03:00',
    duracionMinutos: 30,
  });

  const esperado = new Date('2026-10-20T09:30:00-03:00').toISOString();
  assert.equal(turno.fechaHoraFin.toISOString(), esperado);
  assert.equal(turno.estado, 'RESERVADO');
});
