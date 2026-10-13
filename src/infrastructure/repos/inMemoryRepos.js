'use strict';

const {
  crearProfesional,
  crearSillon,
  crearPrestacion,
  crearPaciente,
} = require('../../domain/entidades');

/**
 * Repositorio in-memory genérico con la operación mínima usada por los
 * servicios: guardar, obtener por id, listar y buscar por campo.
 */
function crearRepositorio() {
  const items = new Map();

  return {
    guardar(entidad) {
      items.set(entidad.id, entidad);
      return entidad;
    },
    obtenerPorId(id) {
      return items.get(id) ?? null;
    },
    listar() {
      return [...items.values()];
    },
    buscarPor(campo, valor) {
      return [...items.values()].filter((entidad) => entidad[campo] === valor);
    },
    limpiar() {
      items.clear();
    },
  };
}

function crearRepositorios() {
  return {
    profesionales: crearRepositorio(),
    sillones: crearRepositorio(),
    prestaciones: crearRepositorio(),
    pacientes: crearRepositorio(),
    turnos: crearRepositorio(),
  };
}

/**
 * Seed mínimo del MVP (datos ficticios, ver knowledge-base/04 §Seed data).
 * Devuelve las entidades sembradas para facilitar los tests.
 */
function sembrar(repos) {
  const profesionales = [
    crearProfesional({ nombre: 'Dr. Pérez', especialidad: 'Odontología general' }),
    crearProfesional({ nombre: 'Dra. Gómez', especialidad: 'Endodoncia' }),
  ].map((entidad) => repos.profesionales.guardar(entidad));

  const sillones = ['Sillón 1', 'Sillón 2', 'Sillón 3'].map((nombre) =>
    repos.sillones.guardar(crearSillon({ nombre })),
  );

  const prestaciones = [
    crearPrestacion({ nombre: 'Consulta', duracionMinutos: 30 }),
    crearPrestacion({ nombre: 'Limpieza', duracionMinutos: 40 }),
    crearPrestacion({ nombre: 'Extracción', duracionMinutos: 45 }),
    crearPrestacion({ nombre: 'Endodoncia', duracionMinutos: 60 }),
  ].map((entidad) => repos.prestaciones.guardar(entidad));

  const pacientes = [
    crearPaciente({ nombre: 'Ana Test', telefono: '+5491100000001' }),
    crearPaciente({ nombre: 'Beto Test', telefono: '+5491100000002' }),
  ].map((entidad) => repos.pacientes.guardar(entidad));

  return { profesionales, sillones, prestaciones, pacientes };
}

module.exports = { crearRepositorio, crearRepositorios, sembrar };
