# Tasks

## 1. Scaffolding (CommonJS)

- [x] 1.1 Crear `package.json` en CommonJS (sin `"type": "module"`) con el script `"test": "node --test"`; verificación: `node --test` corre y finaliza OK (0 tests)
- [x] 1.2 Crear la estructura `src/domain`, `src/application`, `src/infrastructure/repos` y `tests/`; verificación: las carpetas existen y `node --test` sigue finalizando OK
- [x] 1.3 Actualizar `CHANGES.md` §C-01 (scaffolding ESM → CommonJS); verificación: la línea del scaffold ya no menciona `"type": "module"` ni ESM

## 2. Dominio - errores y entidades

- [x] 2.1 Implementar `src/domain/errors.js` con `DomainError` (propiedad `code` estable); verificación: test en `tests/domain.test.js` confirma que dos fallas distintas exponen `code` distinto
- [x] 2.2 Implementar las entidades `Profesional`, `Sillon`, `Prestacion` (valida `duracionMinutos > 0`) y `Paciente`; verificación: test de construcción OK y rechazo con `code` cuando `duracionMinutos <= 0`
- [x] 2.3 Implementar `src/domain/turno.js` con la creación de un `Turno` que deriva `fechaHoraFin` y fija `estado = RESERVADO`; verificación: test confirma `fechaHoraFin == fechaHoraInicio + duracionMinutos`

## 3. Dominio - reglas puras

- [x] 3.1 Implementar `haySolapamiento(a, b)` con intervalos semiabiertos en `src/domain/reglas.js`; verificación: test cubre borde contiguo (`fin == inicio` no solapa) y solapamiento parcial (sí)
- [x] 3.2 Implementar `derivarFin(inicio, duracionMinutos)`; verificación: test con duraciones de 30/40/45/60 min
- [x] 3.3 Implementar `validarSinSolapamiento(candidato, existentes, clave)` ignorando turnos `CANCELADO`; verificación: `tests/reglas.test.js` cubre `PROFESIONAL_OCUPADO`, `SILLON_OCUPADO`, `PACIENTE_OCUPADO` y el caso "cancelado no bloquea"

## 4. Infraestructura - repositorios y seed

- [x] 4.1 Implementar `src/infrastructure/repos/inMemoryRepos.js` (`ProfesionalRepo`, `SillonRepo`, `PrestacionRepo`, `PacienteRepo`, `TurnoRepo`); verificación: `tests/repos.test.js` cubre guardar/obtener/listar/consultar por clave
- [x] 4.2 Implementar el seed mínimo (2 profesionales, 3 sillones, 4 prestaciones, 2 pacientes); verificación: test cuenta los registros sembrados

## 5. Aplicación - crearTurno

- [x] 5.1 Implementar `application/turnosService.crearTurno(input, { repos, ahora })` que resuelve referencias, aplica las reglas y persiste el turno en `RESERVADO`; verificación: camino feliz en `tests/turnos.test.js`
- [x] 5.2 Cubrir los rechazos: `REFERENCIA_INEXISTENTE`, duración inválida, `FECHA_EN_PASADO` y los tres solapamientos; verificación: `tests/turnos.test.js` asserta el `code` de cada caso

## 6. Integración

- [x] 6.1 Correr la suite completa con `node --test` y dejarla en verde; verificación: la salida final no reporta tests fallidos

## Workflow follow-up

- Archivar el change (`/opsx-archive`) una vez satisfechos los requisitos de revisión del proyecto.
- Marcar `C-01` como completado (`[x]`) en `CHANGES.md` al archivar.
