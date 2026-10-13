'use strict';

const { DomainError, CODES } = require('../domain/errors');
const { crearTurno } = require('../domain/turno');
const { validarSinSolapamiento } = require('../domain/reglas');

const ETIQUETAS = Object.freeze({
  profesionalId: 'Profesional',
  sillonId: 'Sillón',
  prestacionId: 'Prestación',
  pacienteId: 'Paciente',
});

/**
 * Caso de uso: crear un turno validando referencias, fecha y solapamientos.
 * Recibe los repositorios y el reloj por inyección de dependencias (DD-01),
 * para que el dominio/servicios sean testeables y puros.
 */
function crearTurnosService({ repos, ahora = () => new Date() } = {}) {
  function resolver(repo, id, etiqueta) {
    const entidad = repo.obtenerPorId(id);
    if (!entidad) {
      throw new DomainError(CODES.REFERENCIA_INEXISTENTE, `${etiqueta} inexistente: ${id}`);
    }
    return entidad;
  }

  function crearTurnoReservado(input) {
    const profesional = resolver(repos.profesionales, input.profesionalId, ETIQUETAS.profesionalId);
    const sillon = resolver(repos.sillones, input.sillonId, ETIQUETAS.sillonId);
    const prestacion = resolver(repos.prestaciones, input.prestacionId, ETIQUETAS.prestacionId);
    const paciente = resolver(repos.pacientes, input.pacienteId, ETIQUETAS.pacienteId);

    if (!(Number.isFinite(prestacion.duracionMinutos) && prestacion.duracionMinutos > 0)) {
      throw new DomainError(
        CODES.DURACION_INVALIDA,
        `La prestación no tiene una duración válida: ${prestacion.duracionMinutos}`,
      );
    }

    const inicio = input.fechaHoraInicio instanceof Date
      ? input.fechaHoraInicio
      : new Date(input.fechaHoraInicio);

    if (inicio.getTime() < ahora().getTime()) {
      throw new DomainError(
        CODES.FECHA_EN_PASADO,
        `No se puede reservar en el pasado: ${inicio.toISOString()}`,
      );
    }

    const candidato = crearTurno({
      pacienteId: paciente.id,
      profesionalId: profesional.id,
      sillonId: sillon.id,
      prestacionId: prestacion.id,
      fechaHoraInicio: inicio,
      duracionMinutos: prestacion.duracionMinutos,
      canalReserva: input.canalReserva,
    });

    const existentes = repos.turnos.listar();
    validarSinSolapamiento(candidato, existentes, 'profesionalId');
    validarSinSolapamiento(candidato, existentes, 'sillonId');
    validarSinSolapamiento(candidato, existentes, 'pacienteId');

    repos.turnos.guardar(candidato);
    return candidato;
  }

  return { crearTurno: crearTurnoReservado };
}

module.exports = { crearTurnosService };
