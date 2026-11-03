# Propuesta

## Why

El dominio ya puede crear turnos sin solapamientos (C-01), pero todavía no existe una forma de ejercitarlo por HTTP ni un contrato visible para quien vaya a integrarse. Antes de encarar el flujo completo de C-06 —que depende de C-02, C-03 y C-04— conviene validar temprano el borde HTTP, el mapeo de errores de dominio y la documentación, con un corte vertical mínimo y desacoplado de esas dependencias.

Este change se agrega como **C-05b**, intermedio entre C-05 y C-06, con ID propio y sin renumerar el roadmap existente.

## What Changes

- **Nuevo endpoint `POST /turnos` mínimo**: recibe `pacienteId`, `profesionalId`, `sillonId`, `prestacionId`, `fechaHoraInicio` (ISO 8601 con offset explícito) y `canalReserva` opcional; delega en `turnosService.crearTurno` y responde `201` con el turno creado.
- **IDs explícitos**: el cliente envía `pacienteId` y `sillonId`. No se resuelve el paciente por teléfono (C-03) ni se asigna sillón automáticamente (C-04).
- **Contrato de errores HTTP estable**: `400` para JSON inválido, campos faltantes, tipos incorrectos o fecha mal formada; `409` para solapamientos (`PROFESIONAL_OCUPADO`, `SILLON_OCUPADO`, `PACIENTE_OCUPADO`); `422` para `REFERENCIA_INEXISTENTE`, `DURACION_INVALIDA` y `FECHA_EN_PASADO`; `500` para fallas inesperadas. Cuerpo uniforme `{ error: { code, message } }`.
- **Documentación autodescriptiva**: `GET /openapi.json` con un documento OpenAPI 3.0.3 y `GET /docs` con Swagger UI servida desde CDN, sin instalar paquetes.
- **Seed de demostración con IDs estables** para que los ejemplos del contrato sean invocables sin leer el código fuente. No reemplaza el seed de C-01.
- **Tests HTTP E2E** con `node:test` y `fetch` nativo sobre un puerto efímero, con reloj inyectado.

**No incluye** (queda para changes posteriores):

- Autenticación o autorización (C-15).
- Persistencia real; los datos siguen en memoria y se pierden al reiniciar (C-16).
- Asignación automática de sillón (C-04); `sillonId` es obligatorio.
- Resolución o alta de paciente por nombre/teléfono (C-03); `pacienteId` es obligatorio.
- Franjas de atención, bloqueos o cálculo de disponibilidad (C-02).
- Cancelar o reprogramar turnos (C-08/C-09).
- Recordatorios (C-12/C-13).
- UI de producto, generación automática de OpenAPI desde el código, CORS productivo, TLS, rate limiting o logging estructurado.

Sin cambios disruptivos (**BREAKING**): none.

## Capabilities

### New Capabilities

- `api-turnos`: contrato HTTP mínimo para crear turnos con IDs explícitos, incluyendo validación de entrada, mapeo estable de errores de dominio y documentación OpenAPI/Swagger.

### Modified Capabilities

- (ninguna). La capacidad existente `turnos` describe el comportamiento de dominio y no cambia; este change agrega una capa de transporte sobre ella.

## Impact

- **Nuevos archivos previstos**: módulo de rutas `POST /turnos`, documento OpenAPI, página Swagger UI, seed de demostración con IDs estables y tests HTTP.
- **Dependencias**: C-01 (completado) y C-05 (servidor HTTP, router, parseo JSON, manejo central de errores y `GET /health`). **No** depende de C-02, C-03 ni C-04.
- **Dependencias externas**: ninguna de npm. La UI de Swagger usa CSS/JS por CDN; el endpoint y los tests no dependen de la CDN.
- **Desbloquea**: una API demostrable y un contrato revisable antes de C-06. C-06 extenderá este handler con resolución de paciente y asignación de sillón; C-07 reemplazará el seed de demostración por endpoints de catálogo.
- **Compatibilidad**: no modifica el change archivado C-01 ni sus artefactos.
