'use strict';

/**
 * Códigos de error de dominio estables y legibles por máquina.
 * El transporte (HTTP) los mapeará a status codes en changes posteriores.
 */
const CODES = Object.freeze({
  PROFESIONAL_OCUPADO: 'PROFESIONAL_OCUPADO',
  SILLON_OCUPADO: 'SILLON_OCUPADO',
  PACIENTE_OCUPADO: 'PACIENTE_OCUPADO',
  FECHA_EN_PASADO: 'FECHA_EN_PASADO',
  REFERENCIA_INEXISTENTE: 'REFERENCIA_INEXISTENTE',
  DURACION_INVALIDA: 'DURACION_INVALIDA',
  ESTADO_INVALIDO: 'ESTADO_INVALIDO',
});

class DomainError extends Error {
  constructor(code, message) {
    super(message || code);
    this.name = 'DomainError';
    this.code = code;
  }
}

module.exports = { DomainError, CODES };
