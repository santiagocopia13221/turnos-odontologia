'use strict';

/**
 * Estados y canales válidos de un Turno.
 * Viven en su propio módulo para evitar dependencias circulares entre
 * `turno.js` y `reglas.js`.
 */
const ESTADOS = Object.freeze({
  RESERVADO: 'RESERVADO',
  CANCELADO: 'CANCELADO',
  COMPLETADO: 'COMPLETADO',
  AUSENTE: 'AUSENTE',
});

const CANALES = Object.freeze({
  ONLINE: 'ONLINE',
  RECEPCION: 'RECEPCION',
});

module.exports = { ESTADOS, CANALES };
