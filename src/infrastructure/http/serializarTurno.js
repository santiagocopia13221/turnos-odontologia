'use strict';

function aISO8601(valor) {
  const fecha = valor instanceof Date ? valor : new Date(valor);
  return fecha.toISOString();
}

/**
 * Contrato HTTP del turno: fechas UTC con milisegundos y sufijo Z,
 * referencias explícitas y sin campos internos.
 */
function serializarTurno(turno) {
  return {
    id: turno.id,
    pacienteId: turno.pacienteId,
    profesionalId: turno.profesionalId,
    sillonId: turno.sillonId,
    prestacionId: turno.prestacionId,
    fechaHoraInicio: aISO8601(turno.fechaHoraInicio),
    fechaHoraFin: aISO8601(turno.fechaHoraFin),
    estado: turno.estado,
    canalReserva: turno.canalReserva,
    creadoEn: aISO8601(turno.creadoEn),
    actualizadoEn: aISO8601(turno.actualizadoEn),
  };
}

module.exports = { serializarTurno };
