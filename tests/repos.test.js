'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const { crearRepositorio, crearRepositorios, sembrar } = require('../src/infrastructure/repos/inMemoryRepos');

test('Repositorio: guardar, obtener, listar y buscar por campo', () => {
  const repo = crearRepositorio();

  repo.guardar({ id: 'a', nombre: 'Uno', activo: true });
  repo.guardar({ id: 'b', nombre: 'Dos', activo: false });

  assert.equal(repo.obtenerPorId('a').nombre, 'Uno');
  assert.equal(repo.obtenerPorId('inexistente'), null);
  assert.equal(repo.listar().length, 2);
  assert.deepEqual(
    repo.buscarPor('activo', true).map((entidad) => entidad.id),
    ['a'],
  );
});

test('Seed mínimo: 2 profesionales, 3 sillones, 4 prestaciones y 2 pacientes', () => {
  const repos = crearRepositorios();
  const seed = sembrar(repos);

  assert.equal(seed.profesionales.length, 2);
  assert.equal(seed.sillones.length, 3);
  assert.equal(seed.prestaciones.length, 4);
  assert.equal(seed.pacientes.length, 2);

  assert.equal(repos.sillones.listar().length, 3);
  assert.equal(repos.profesionales.listar().length, 2);
});
