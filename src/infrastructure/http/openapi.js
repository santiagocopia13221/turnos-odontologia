'use strict';

const { ESTADOS, CANALES } = require('../../domain/estados');
const { IDS_DEMO } = require('../repos/demoSeed');

const OFFSET_ARGENTINA_MINUTOS = -180;
const MS_POR_MINUTO = 60 * 1000;

function dosDigitos(valor) {
  return String(valor).padStart(2, '0');
}

/**
 * Calcula el ejemplo como el día siguiente a las 10:00 en Argentina (UTC-3).
 * Se recalcula en cada request para que el ejemplo publicado sea siempre futuro.
 */
function calcularFechaEjemplo(ahora = new Date()) {
  const instante = ahora instanceof Date ? ahora : new Date(ahora);

  if (Number.isNaN(instante.getTime())) {
    throw new Error('El reloj inyectado no es una fecha válida');
  }

  const local = new Date(instante.getTime() + OFFSET_ARGENTINA_MINUTOS * MS_POR_MINUTO);
  const siguiente = new Date(
    Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate() + 1),
  );

  return `${siguiente.getUTCFullYear()}-${dosDigitos(siguiente.getUTCMonth() + 1)}-${dosDigitos(
    siguiente.getUTCDate(),
  )}T10:00:00-03:00`;
}

function crearRespuestaError(description, code, message) {
  return {
    description,
    content: {
      'application/json': {
        schema: { $ref: '#/components/schemas/Error' },
        example: { error: { code, message } },
      },
    },
  };
}

function crearOpenApi({ ahora = () => new Date() } = {}) {
  const reloj = typeof ahora === 'function' ? ahora() : ahora;
  const fechaEjemplo = calcularFechaEjemplo(reloj);
  const canales = Object.values(CANALES);

  return {
    openapi: '3.0.3',
    info: {
      title: 'API mínima de turnos',
      version: '0.1.0',
      description:
        'Corte vertical mínimo para crear turnos con IDs explícitos y datos de demostración ficticios.',
    },
    paths: {
      '/turnos': {
        post: {
          tags: ['Turnos'],
          summary: 'Crear un turno con referencias explícitas',
          operationId: 'crearTurno',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/TurnoCreateRequest' },
                example: {
                  pacienteId: IDS_DEMO.paciente,
                  profesionalId: IDS_DEMO.profesional,
                  sillonId: IDS_DEMO.sillon,
                  prestacionId: IDS_DEMO.prestacion,
                  fechaHoraInicio: fechaEjemplo,
                  canalReserva: CANALES.ONLINE,
                },
              },
            },
          },
          responses: {
            201: {
              description: 'Turno creado en estado RESERVADO',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/TurnoResponse' },
                },
              },
            },
            400: { $ref: '#/components/responses/DatosInvalidos' },
            409: { $ref: '#/components/responses/Conflicto' },
            422: { $ref: '#/components/responses/EntidadNoProcesable' },
            500: { $ref: '#/components/responses/ErrorInterno' },
          },
        },
      },
    },
    components: {
      schemas: {
        TurnoCreateRequest: {
          type: 'object',
          additionalProperties: false,
          required: [
            'pacienteId',
            'profesionalId',
            'sillonId',
            'prestacionId',
            'fechaHoraInicio',
          ],
          properties: {
            pacienteId: {
              type: 'string',
              example: IDS_DEMO.paciente,
              description: 'ID explícito del paciente; no se resuelve por teléfono.',
            },
            profesionalId: {
              type: 'string',
              example: IDS_DEMO.profesional,
              description: 'ID explícito del profesional.',
            },
            sillonId: {
              type: 'string',
              example: IDS_DEMO.sillon,
              description: 'ID explícito del sillón; no se asigna automáticamente.',
            },
            prestacionId: {
              type: 'string',
              example: IDS_DEMO.prestacion,
              description: 'La duración se deriva de esta prestación (RN-TU-04/RN-PR-01).',
            },
            fechaHoraInicio: {
              type: 'string',
              format: 'date-time',
              example: fechaEjemplo,
              description: 'Fecha-hora ISO 8601 con offset explícito (Z o ±HH:MM).',
            },
            canalReserva: {
              type: 'string',
              enum: canales,
              default: CANALES.ONLINE,
              example: CANALES.ONLINE,
              description: 'Canal de la reserva. Si se omite, se usa ONLINE.',
            },
          },
        },
        Turno: {
          type: 'object',
          required: [
            'id',
            'pacienteId',
            'profesionalId',
            'sillonId',
            'prestacionId',
            'fechaHoraInicio',
            'fechaHoraFin',
            'estado',
            'canalReserva',
            'creadoEn',
            'actualizadoEn',
          ],
          properties: {
            id: { type: 'string', example: '2f1c8f1e-4d1a-4c1e-9b1a-000000000001' },
            pacienteId: { type: 'string', example: IDS_DEMO.paciente },
            profesionalId: { type: 'string', example: IDS_DEMO.profesional },
            sillonId: { type: 'string', example: IDS_DEMO.sillon },
            prestacionId: { type: 'string', example: IDS_DEMO.prestacion },
            fechaHoraInicio: {
              type: 'string',
              example: '2026-11-10T13:00:00.000Z',
              description: 'Instante UTC con milisegundos y sufijo Z.',
            },
            fechaHoraFin: {
              type: 'string',
              example: '2026-11-10T13:30:00.000Z',
              description: 'Inicio más la duración de la prestación.',
            },
            estado: { type: 'string', enum: Object.values(ESTADOS), example: ESTADOS.RESERVADO },
            canalReserva: { type: 'string', enum: canales, example: CANALES.ONLINE },
            creadoEn: { type: 'string', example: '2026-11-03T15:00:00.000Z' },
            actualizadoEn: { type: 'string', example: '2026-11-03T15:00:00.000Z' },
          },
        },
        TurnoResponse: {
          type: 'object',
          required: ['turno'],
          properties: {
            turno: { $ref: '#/components/schemas/Turno' },
          },
        },
        Error: {
          type: 'object',
          required: ['error'],
          properties: {
            error: {
              type: 'object',
              required: ['code', 'message'],
              properties: {
                code: { type: 'string', example: 'DATOS_INVALIDOS' },
                message: { type: 'string', example: 'El cuerpo de la solicitud no es JSON válido' },
              },
            },
          },
        },
      },
      responses: {
        DatosInvalidos: crearRespuestaError(
          'Datos de entrada inválidos',
          'DATOS_INVALIDOS',
          'El campo "prestacionId" es obligatorio',
        ),
        Conflicto: crearRespuestaError(
          'Conflicto de agenda',
          'PROFESIONAL_OCUPADO',
          'El profesional ya está ocupado en el horario solicitado',
        ),
        EntidadNoProcesable: crearRespuestaError(
          'Referencia o valor semánticamente inválido',
          'REFERENCIA_INEXISTENTE',
          'Profesional inexistente: prof-inexistente',
        ),
        ErrorInterno: crearRespuestaError(
          'Error interno del servidor',
          'ERROR_INTERNO',
          'Error interno del servidor',
        ),
      },
    },
  };
}

module.exports = { crearOpenApi, calcularFechaEjemplo };
