# turnos-odontologia

Sistema de gestión de turnos para consultorios odontológicos (Argentina). Proyecto de Metodología I (UTN, Tecnicatura en Programación), desarrollado con Active Stack y Spec-Driven Development (OpenSpec). Todos los datos son ficticios.

## Estado del proyecto

| Change | Descripción | Estado |
|---|---|---|
| C-01 | Crear turno sin solapamientos (dominio) | Completo y archivado |
| C-05 | Servidor HTTP, router y manejo de errores | Completo y archivado |
| C-05b | API mínima de turnos: POST /turnos, OpenAPI y Swagger UI | Completo y archivado |
| C-02, C-03, C-04, C-06 a C-18 | Resto del roadmap (ver `CHANGES.md`) | Pendiente, no implementado |

Decisión abierta: quién valida que la prestación y el sillón estén activos (RN-PR-02 y RN-SI-03) y con qué código de error. No existe todavía un código estable para "referencia inactiva"; queda fuera del alcance de C-05b.

Los changes archivados están en `openspec/changes/archive/` y las especificaciones vigentes en `openspec/specs/`.

## Requisitos

- Node.js 20 o superior (`node --version`).
- No usa dependencias externas: no hace falta `npm install`.
- Conexión a internet solo para que `/docs` cargue Swagger UI desde un CDN (la API funciona sin ella).

## Instalación

```bash
git clone https://github.com/santiagocopia13221/turnos-odontologia.git
cd turnos-odontologia
```

## Configuración

La única configuración es el puerto, por la variable de entorno `PORT`. No hay valor por defecto: si no se define o es inválido, el servidor no arranca. No hay secretos ni credenciales en el proyecto.

## Datos de demostración (ficticios)

Al arrancar se cargan en memoria datos de ejemplo con identificadores fijos: profesional `prof-1`, sillón `sillon-1`, prestación `prestacion-consulta` y paciente `paciente-ana`. La persistencia es en memoria: al reiniciar el servidor, los datos vuelven al estado inicial.

## Arrancar el backend

En `cmd` (Windows):

```bash
set PORT=3000
node src/index.js
```

En PowerShell: `$env:PORT=3000; node src/index.js`. En Linux o macOS: `PORT=3000 node src/index.js`. Para detenerlo, `Ctrl+C`.

## Swagger y API

- Swagger UI: http://localhost:3000/docs
- Contrato OpenAPI 3.0.3: http://localhost:3000/openapi.json
- Estado del servicio: http://localhost:3000/health (responde `{"status":"ok"}`)
- Crear turno: `POST /turnos` con `pacienteId`, `profesionalId`, `sillonId`, `prestacionId`, `fechaHoraInicio` (ISO 8601 con offset, por ejemplo `-03:00`) y `canalReserva` opcional (`ONLINE` por defecto o `RECEPCION`). La duración siempre se deriva de la prestación; si se envía `duracionMinutos` se responde 400.

En Swagger, el ejemplo de `POST /turnos` ya viene cargado con los datos de demostración y una fecha futura. Respuestas: `201` turno creado, `400` datos inválidos, `409` solapamiento (profesional, sillón o paciente; prioridad en ese orden), `422` referencia inexistente, duración inválida o fecha en el pasado, `500` error inesperado. Si se ejecuta el mismo ejemplo dos veces sin reiniciar el servidor, la segunda responde `409` porque el horario ya quedó ocupado.

## Tests

```bash
node --test
```

Resultado actual: 69 tests, 69 pasan, 0 fallan (dominio de C-01, servidor HTTP de C-05 y API de turnos de C-05b).

## Estructura

- `src/domain`, `src/application`: reglas de negocio y servicio de turnos.
- `src/infrastructure/repos`: repositorios en memoria y datos de demostración.
- `src/infrastructure/http`: router, errores, servidor, validación, OpenAPI y Swagger.
- `src/index.js`: arranque del servidor.
- `tests/`: pruebas con `node:test`.
- `knowledge-base/`, `discovery/`, `docs/discovery/`: base de conocimiento y descubrimiento.
- `CHANGES.md`: roadmap de changes. `openspec/`: changes archivados y especificaciones.
- `AGENTS.md` y `CLAUDE.md`: instrucciones del agente (idénticos). `.atl/skill-registry.md`: registro de skills.

## Skill propia: revisor-escenarios-turnos

Revisa la especificación de un change contra las reglas de negocio de `knowledge-base/05_reglas_de_negocio.md` y devuelve una tabla de hallazgos con reglas RN-XX, escenarios CUANDO/ENTONCES, decisiones abiertas y un veredicto (BLOQUEANTE, CON OBSERVACIONES u OK). Se creó y validó con la skill creadora `skill-creator`. Está en `.opencode/skills/revisor-escenarios-turnos/SKILL.md`, registrada en `.atl/skill-registry.md` y referenciada en `AGENTS.md` y `CLAUDE.md`. Para probarla, abrir OpenCode en la raíz del repo y pedirle que revise la spec de un change de turnos.

## Integración MCP (Context7)

Servidor MCP remoto que consulta documentación actualizada de librerías (se usó para Swagger UI y OpenAPI en C-05b).

- Configuración: `opencode.json` en la raíz (tipo `remote`, URL `https://mcp.context7.com/mcp`). No requiere instalar paquetes ni credenciales.
- Comprobación: `opencode mcp list` debe mostrar `context7` conectado; `opencode mcp debug context7` para diagnóstico.
- Variables de entorno: `CONTEXT7_API_KEY` es opcional y no hace falta para reproducir este trabajo; si se usa, definirla como variable de entorno del sistema y nunca escribirla en el repositorio. Ver https://docs.opencode.ai/docs/mcp-servers
- Límites: solo lectura de documentación; las consultas salen a un servicio externo, por eso no se pegan secretos ni datos de pacientes. Lo que devuelve se contrasta con las fuentes oficiales.
- Evidencias de uso: `docs/skills-mcp/` (ficha de investigación, informe de aplicación, revisiones de la skill, usos de Context7 y capturas).

## Limitaciones conocidas

- Persistencia solo en memoria; sin autenticación ni permisos.
- Swagger UI depende de un CDN (versión exacta 5.11.0 de swagger-ui-dist).
- Pendiente: validación de prestaciones y sillones inactivos, franjas y bloqueos de agenda, resolución de pacientes y asignación de sillón (ver `CHANGES.md`).