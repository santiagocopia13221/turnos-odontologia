'use strict';

const { CANALES } = require('../../domain/estados');
const { HttpError } = require('./errors');

const ISO_8601_CON_OFFSET =
  /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.(\d{1,3}))?(Z|[+-]\d{2}:\d{2})$/;

const CAMPOS_ID = ['pacienteId', 'profesionalId', 'sillonId', 'prestacionId'];

function datosInvalidos(mensaje) {
  return new HttpError(400, 'DATOS_INVALIDOS', mensaje);
}

/**
 * Acepta únicamente fecha-hora ISO 8601 con offset explícito (`Z` o ±HH:MM).
 * Devuelve `null` para formatos ambiguos, valores no parseables o fechas
 * fuera de rango que `Date` normalizaría silenciosamente.
 */
function parsearFechaHoraConOffset(valor) {
  if (typeof valor !== 'string') {
    return null;
  }

  const coincidencia = ISO_8601_CON_OFFSET.exec(valor);
  if (!coincidencia) {
    return null;
  }

  const [
    ,
    anio,
    mes,
    dia,
    hora,
    minuto,
    segundo,
    fraccion,
    zona,
  ] = coincidencia;

  const anioNumero = Number(anio);
  const mesNumero = Number(mes);
  const diaNumero = Number(dia);
  const horaNumero = Number(hora);
  const minutoNumero = Number(minuto);
  const segundoNumero = Number(segundo);
  const milisegundos = fraccion ? Number((fraccion + '000').slice(0, 3)) : 0;

  const base = Date.UTC(
    anioNumero,
    mesNumero - 1,
    diaNumero,
    horaNumero,
    minutoNumero,
    segundoNumero,
    milisegundos,
  );
  const control = new Date(base);

  if (
    control.getUTCFullYear() !== anioNumero ||
    control.getUTCMonth() !== mesNumero - 1 ||
    control.getUTCDate() !== diaNumero ||
    control.getUTCHours() !== horaNumero ||
    control.getUTCMinutes() !== minutoNumero ||
    control.getUTCSeconds() !== segundoNumero ||
    control.getUTCMilliseconds() !== milisegundos
  ) {
    return null;
  }

  let offsetMinutos = 0;
  if (zona !== 'Z') {
    const offsetHoras = Number(zona.slice(1, 3));
    const offsetMinutosParte = Number(zona.slice(4, 6));

    if (offsetHoras > 23 || offsetMinutosParte > 59) {
      return null;
    }

    const signo = zona[0] === '+' ? 1 : -1;
    offsetMinutos = signo * (offsetHoras * 60 + offsetMinutosParte);
  }

  return new Date(base - offsetMinutos * 60 * 1000);
}

function validarTurno(body) {
  if (body === null || typeof body !== 'object' || Array.isArray(body)) {
    throw datosInvalidos('El cuerpo debe ser un objeto JSON');
  }

  if (Object.prototype.hasOwnProperty.call(body, 'duracionMinutos')) {
    throw datosInvalidos(
      'La duración no se envía en el cuerpo; se deriva de la prestación (RN-TU-04/RN-PR-01)',
    );
  }

  for (const campo of CAMPOS_ID) {
    if (typeof body[campo] !== 'string' || body[campo].trim() === '') {
      throw datosInvalidos(`El campo "${campo}" es obligatorio y debe ser un string no vacío`);
    }
  }

  const fechaHoraInicio = parsearFechaHoraConOffset(body.fechaHoraInicio);
  if (!fechaHoraInicio) {
    throw datosInvalidos(
      'El campo "fechaHoraInicio" debe ser ISO 8601 con offset explícito (Z o ±HH:MM)',
    );
  }

  let canalReserva = body.canalReserva;
  if (canalReserva === undefined) {
    canalReserva = CANALES.ONLINE;
  }

  if (typeof canalReserva !== 'string' || !Object.values(CANALES).includes(canalReserva)) {
    throw datosInvalidos('El campo "canalReserva" debe ser ONLINE o RECEPCION');
  }

  return {
    pacienteId: body.pacienteId,
    profesionalId: body.profesionalId,
    sillonId: body.sillonId,
    prestacionId: body.prestacionId,
    fechaHoraInicio,
    canalReserva,
  };
}

module.exports = { validarTurno, parsearFechaHoraConOffset };
