'use strict';

/**
 * Router mínimo por método y ruta exacta.
 * El query string no participa del matching; el servidor lo expone al handler.
 */
function crearRouter() {
  const rutas = new Map();

  function normalizarRuta(ruta) {
    if (typeof ruta !== 'string') {
      return ruta;
    }
    const indiceQuery = ruta.indexOf('?');
    return indiceQuery === -1 ? ruta : ruta.slice(0, indiceQuery);
  }

  function registrar(metodo, ruta, handler) {
    if (typeof metodo !== 'string' || metodo.trim() === '') {
      throw new Error('El método HTTP es obligatorio para registrar una ruta');
    }
    if (typeof ruta !== 'string' || !ruta.startsWith('/')) {
      throw new Error('La ruta debe ser un string que empiece con "/"');
    }
    if (typeof handler !== 'function') {
      throw new Error('El handler de la ruta debe ser una función');
    }

    const clave = `${metodo.toUpperCase()} ${ruta}`;
    if (rutas.has(clave)) {
      throw new Error(`Ruta duplicada: ${clave}`);
    }

    rutas.set(clave, handler);
    return handler;
  }

  function resolver(metodo, ruta) {
    const metodoNormalizado = typeof metodo === 'string' ? metodo.toUpperCase() : metodo;
    return rutas.get(`${metodoNormalizado} ${normalizarRuta(ruta)}`) ?? null;
  }

  return { registrar, resolver };
}

module.exports = { crearRouter };
