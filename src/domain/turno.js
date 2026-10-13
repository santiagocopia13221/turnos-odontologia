'use strict';

const { randomUUID } = require('node:crypto');
const { DomainError, CODES } = require('./errors');
const { ESTADOS } = require('./estados');
const { derivarFin } = require('./reglas');

/**
 * Crea un Turno aplicando sus invariantes: duración > 0, estado válido y
 * fechaHoraFin derivada del inicio + duración (RN-TU-04 / RN-TU-08).
 */
function crearTurno({
  id = randomUUID(),
  pacienteId,
  profesionalId,
  sillonId,
  prestacionId,
  fechaHoraInicio,
  duracionMinutos,
  estado = ESTADOS.RESERVADO,
  canalReserva,
  creadoEn = new Date(),
} = {}) {
  if (!(Number.isFinite(duracionMinutos) && duracionMinutos > 0)) {
    throw new DomainError(
      CODES.DURACION_INVALIDA,
      `duracionMinutos debe ser un número > 0 (recibido: ${duracionMinutos})`,
    );
  }

  if (!Object.values(ESTADOS).includes(estado)) {
    throw new DomainError(CODES.ESTADO_INVALIDO, `estado inválido: ${estado}`);
  }

  const inicio = fechaHoraInicio instanceof Date ? fechaHoraInicio : new Date(fechaHoraInicio);

  return {
    id,
    pacienteId,
    profesionalId,
    sillonId,
    prestacionId,
    fechaHoraInicio: inicio,
    fechaHoraFin: derivarFin(inicio, duracionMinutos),
    estado,
    canalReserva,
    creadoEn,
    actualizadoEn: creadoEn,
  };
}

module.exports = { crearTurno };
