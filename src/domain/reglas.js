'use strict';

const { DomainError, CODES } = require('./errors');
const { ESTADOS } = require('./estados');

const MS_POR_MINUTO = 60 * 1000;

/** Campo clave -> código de error de solapamiento. */
const CLAVE_A_CODIGO = Object.freeze({
  profesionalId: CODES.PROFESIONAL_OCUPADO,
  sillonId: CODES.SILLON_OCUPADO,
  pacienteId: CODES.PACIENTE_OCUPADO,
});

function aMilisegundos(valor) {
  return valor instanceof Date ? valor.getTime() : new Date(valor).getTime();
}

/** Fin del turno = inicio + duración (RN-TU-04 / RN-TU-08). */
function derivarFin(inicio, duracionMinutos) {
  return new Date(aMilisegundos(inicio) + duracionMinutos * MS_POR_MINUTO);
}

/**
 * Solapamiento con intervalos semiabiertos [inicio, fin) (RN-TU-08):
 * si un turno termina justo cuando otro empieza (`fin == inicio`) NO solapan.
 */
function haySolapamiento(a, b) {
  const aInicio = aMilisegundos(a.fechaHoraInicio);
  const aFin = aMilisegundos(a.fechaHoraFin);
  const bInicio = aMilisegundos(b.fechaHoraInicio);
  const bFin = aMilisegundos(b.fechaHoraFin);
  return aInicio < bFin && bInicio < aFin;
}

/**
 * Lanza un DomainError tipado si `candidato` se solapa con algún turno activo
 * de los `existentes` que comparta la `clave` (profesionalId/sillonId/pacienteId).
 * Ignora los turnos CANCELADO (RN-TU-09).
 */
function validarSinSolapamiento(candidato, existentes, clave) {
  const code = CLAVE_A_CODIGO[clave];
  if (!code) {
    throw new Error(`Clave de solapamiento desconocida: ${clave}`);
  }

  const delMismoRecurso = existentes.filter(
    (turno) => turno.estado !== ESTADOS.CANCELADO && turno[clave] === candidato[clave],
  );

  for (const turno of delMismoRecurso) {
    if (haySolapamiento(candidato, turno)) {
      throw new DomainError(code, `El recurso (${clave}) ya está ocupado en el horario solicitado`);
    }
  }
}

module.exports = { haySolapamiento, derivarFin, validarSinSolapamiento };
