'use strict';

const { crearTurnosService } = require('../../application/turnosService');
const { validarTurno } = require('./validarTurno');
const { serializarTurno } = require('./serializarTurno');
const { crearOpenApi } = require('./openapi');
const { crearPaginaDocs } = require('./docs');

/**
 * Módulo de rutas de C-05b sobre el router existente de C-05.
 * No crea un servidor nuevo ni duplica el manejo central de errores.
 */
function registrarRutasTurnos(router, deps) {
  const turnosService = crearTurnosService({
    repos: deps.repos,
    ahora: deps.ahora,
  });

  router.registrar('POST', '/turnos', ({ body }) => {
    const input = validarTurno(body);
    const turno = turnosService.crearTurno(input);

    return {
      status: 201,
      body: { turno: serializarTurno(turno) },
    };
  });

  router.registrar('GET', '/openapi.json', () => ({
    status: 200,
    body: crearOpenApi({ ahora: deps.ahora }),
  }));

  router.registrar('GET', '/docs', () => ({
    status: 200,
    body: crearPaginaDocs(),
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  }));
}

module.exports = { registrarRutasTurnos };
