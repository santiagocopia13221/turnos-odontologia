'use strict';

const { randomUUID } = require('node:crypto');
const { DomainError, CODES } = require('./errors');

function crearProfesional({ id = randomUUID(), nombre, especialidad = null, activo = true } = {}) {
  return { id, nombre, especialidad, activo };
}

function crearSillon({ id = randomUUID(), nombre, activo = true } = {}) {
  return { id, nombre, activo };
}

function crearPrestacion({ id = randomUUID(), nombre, duracionMinutos, activo = true } = {}) {
  if (!(Number.isFinite(duracionMinutos) && duracionMinutos > 0)) {
    throw new DomainError(
      CODES.DURACION_INVALIDA,
      `duracionMinutos debe ser un número > 0 (recibido: ${duracionMinutos})`,
    );
  }
  return { id, nombre, duracionMinutos, activo };
}

function crearPaciente({ id = randomUUID(), nombre, telefono } = {}) {
  return { id, nombre, telefono };
}

module.exports = { crearProfesional, crearSillon, crearPrestacion, crearPaciente };
