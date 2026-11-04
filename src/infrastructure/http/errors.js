'use strict';

const { DomainError } = require('../../domain/errors');

const CODIGOS_HTTP = Object.freeze({
  DATOS_INVALIDOS: 400,
  RUTA_NO_ENCONTRADA: 404,
  PROFESIONAL_OCUPADO: 409,
  SILLON_OCUPADO: 409,
  PACIENTE_OCUPADO: 409,
  ESTADO_INVALIDO: 409,
  FUERA_DE_FRANJA: 422,
  FECHA_EN_PASADO: 422,
  REFERENCIA_INEXISTENTE: 422,
  DURACION_INVALIDA: 422,
});

class HttpError extends Error {
  constructor(status, code, message) {
    super(message || code);
    this.name = 'HttpError';
    this.status = status;
    this.code = code;
  }
}

/**
 * Traduce un error de la capa HTTP o del dominio a status, código y mensaje.
 * Los errores no controlados se ocultan detrás de un mensaje genérico.
 */
function mapearError(error) {
  if (error instanceof HttpError) {
    return { status: error.status, code: error.code, message: error.message };
  }

  if (error instanceof DomainError && CODIGOS_HTTP[error.code]) {
    return { status: CODIGOS_HTTP[error.code], code: error.code, message: error.message };
  }

  return {
    status: 500,
    code: 'ERROR_INTERNO',
    message: 'Error interno del servidor',
  };
}

function crearCuerpoError({ code, message }) {
  return { error: { code, message } };
}

module.exports = { HttpError, CODIGOS_HTTP, mapearError, crearCuerpoError };
