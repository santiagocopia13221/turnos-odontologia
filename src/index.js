'use strict';

const { crearServidor } = require('./infrastructure/http/server');
const { crearRepositorios, sembrar } = require('./infrastructure/repos/inMemoryRepos');

function resolverPuerto(puerto) {
  const valor = puerto !== undefined && puerto !== null ? puerto : process.env.PORT;

  if (valor === undefined || valor === null || valor === '') {
    throw new Error(
      'Configuración inválida: definí la variable de entorno PORT o pasá el puerto al arrancar',
    );
  }

  const numero = typeof valor === 'number' ? valor : Number(valor);
  if (!Number.isInteger(numero) || numero < 0 || numero > 65535) {
    throw new Error(`Configuración inválida: el puerto debe ser un entero entre 0 y 65535 (${valor})`);
  }

  return numero;
}

function crearCierre(server) {
  let cierre = null;

  return function cerrar() {
    if (cierre) {
      return cierre;
    }

    if (!server.listening) {
      cierre = Promise.resolve();
      return cierre;
    }

    cierre = new Promise((resolve, reject) => {
      server.close((error) => {
        if (error) {
          reject(error);
          return;
        }
        resolve();
      });

      if (typeof server.closeAllConnections === 'function') {
        server.closeAllConnections();
      }
    });

    return cierre;
  };
}

async function escuchar(server, puerto, host) {
  await new Promise((resolve, reject) => {
    function alEscuchar() {
      server.off('error', alFallar);
      resolve();
    }

    function alFallar(error) {
      server.off('listening', alEscuchar);
      reject(error);
    }

    server.once('listening', alEscuchar);
    server.once('error', alFallar);
    server.listen(puerto, host);
  });
}

/**
 * Arranca el servidor HTTP con dependencias inyectables.
 * Si no se pasan repositorios, usa el seed mínimo de C-01.
 */
async function iniciarServidor({
  puerto,
  host = '127.0.0.1',
  repos,
  ahora = () => new Date(),
  rutas = [],
  logger = console,
} = {}) {
  const puertoResuelto = resolverPuerto(puerto);

  if (!Array.isArray(rutas)) {
    throw new Error('El parámetro rutas debe ser un array de módulos de rutas');
  }

  const repositorios = repos ?? crearRepositorios();
  if (!repos) {
    sembrar(repositorios);
  }

  const { server, router, deps } = crearServidor({
    repos: repositorios,
    ahora,
    logger,
  });

  for (const modulo of rutas) {
    if (typeof modulo !== 'function') {
      throw new Error('Cada módulo de rutas debe ser una función (router, deps) => void');
    }
    modulo(router, deps);
  }

  await escuchar(server, puertoResuelto, host);

  const direccion = server.address();
  const puertoReal = direccion && typeof direccion === 'object' ? direccion.port : puertoResuelto;

  return {
    server,
    router,
    deps,
    puerto: puertoReal,
    url: `http://${host}:${puertoReal}`,
    cerrar: crearCierre(server),
  };
}

if (require.main === module) {
  iniciarServidor()
    .then((handle) => {
      function cerrarYsalir() {
        handle
          .cerrar()
          .then(() => process.exit(0))
          .catch(() => process.exit(1));
      }

      process.once('SIGINT', cerrarYsalir);
      process.once('SIGTERM', cerrarYsalir);
      process.stdout.write(`Servidor escuchando en ${handle.url}\n`);
    })
    .catch((error) => {
      process.stderr.write(`${error.message}\n`);
      process.exitCode = 1;
    });
}

module.exports = { iniciarServidor, resolverPuerto };
