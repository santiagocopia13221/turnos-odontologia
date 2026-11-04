'use strict';

const {
  crearProfesional,
  crearSillon,
  crearPrestacion,
  crearPaciente,
} = require('../../domain/entidades');

/**
 * IDs estables del seed de demostración de C-05b.
 * Son ficticios y no reemplazan el seed mínimo de C-01.
 */
const IDS_DEMO = Object.freeze({
  profesional: 'prof-1',
  profesionalAlternativo: 'prof-2',
  sillon: 'sillon-1',
  sillonAlternativo: 'sillon-2',
  sillonTercero: 'sillon-3',
  prestacion: 'prestacion-consulta',
  prestacionLimpieza: 'prestacion-limpieza',
  prestacionExtraccion: 'prestacion-extraccion',
  prestacionEndodoncia: 'prestacion-endodoncia',
  paciente: 'paciente-ana',
  pacienteAlternativo: 'paciente-beto',
});

/**
 * Siembra datos de demostración con IDs legibles por humanos.
 * Devuelve las entidades sembradas para facilitar tests y smoke checks.
 */
function sembrarDemo(repos) {
  const profesionales = [
    crearProfesional({
      id: IDS_DEMO.profesional,
      nombre: 'Dr. Demo Uno',
      especialidad: 'Odontología general',
    }),
    crearProfesional({
      id: IDS_DEMO.profesionalAlternativo,
      nombre: 'Dra. Demo Dos',
      especialidad: 'Endodoncia',
    }),
  ].map((entidad) => repos.profesionales.guardar(entidad));

  const sillones = [
    crearSillon({ id: IDS_DEMO.sillon, nombre: 'Sillón Demo 1' }),
    crearSillon({ id: IDS_DEMO.sillonAlternativo, nombre: 'Sillón Demo 2' }),
    crearSillon({ id: IDS_DEMO.sillonTercero, nombre: 'Sillón Demo 3' }),
  ].map((entidad) => repos.sillones.guardar(entidad));

  const prestaciones = [
    crearPrestacion({
      id: IDS_DEMO.prestacion,
      nombre: 'Consulta',
      duracionMinutos: 30,
    }),
    crearPrestacion({
      id: IDS_DEMO.prestacionLimpieza,
      nombre: 'Limpieza',
      duracionMinutos: 40,
    }),
    crearPrestacion({
      id: IDS_DEMO.prestacionExtraccion,
      nombre: 'Extracción',
      duracionMinutos: 45,
    }),
    crearPrestacion({
      id: IDS_DEMO.prestacionEndodoncia,
      nombre: 'Endodoncia',
      duracionMinutos: 60,
    }),
  ].map((entidad) => repos.prestaciones.guardar(entidad));

  const pacientes = [
    crearPaciente({
      id: IDS_DEMO.paciente,
      nombre: 'Ana Demo',
      telefono: '+5491100000101',
    }),
    crearPaciente({
      id: IDS_DEMO.pacienteAlternativo,
      nombre: 'Beto Demo',
      telefono: '+5491100000102',
    }),
  ].map((entidad) => repos.pacientes.guardar(entidad));

  return { profesionales, sillones, prestaciones, pacientes };
}

module.exports = { IDS_DEMO, sembrarDemo };
