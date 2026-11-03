# Ficha de investigación: skill propia y servidor MCP

Fecha de consulta de las fuentes: 2026-11-03. Agente utilizado: OpenCode (modelo Big Pickle).

## 1. Necesidad detectada
Al preparar un change hay que revisar que sus escenarios (CUANDO/ENTONCES) no tengan reglas ambiguas ni casos de borde faltantes. Es una tarea repetible: **skill propia**. Además, para armar la API necesitamos consultar documentación actualizada (OpenAPI/Swagger UI) sin salir del flujo: **servidor MCP**.

## 2. Change elegido
API HTTP mínima para crear turnos con documentación Swagger (change intermedio sobre C-01; el ID exacto queda en `CHANGES.md`). No depende de funcionalidades inexistentes: reutiliza `crearTurno` de C-01 con `sillonId` explícito. Exclusiones: autenticación, persistencia real y asignación automática de sillón.

## 3. Skill creadora y diseño de la skill propia
- **Skill creadora:** `skill-creator`, ya incluida en el entorno (figura en `AGENTS.md`, tabla "Meta / Skills"). Fuente del autor: **pendiente de verificar** en `.atl/skill-registry.md`.
- **Dónde se guarda:** OpenCode busca skills en `.opencode/skills/<nombre>/SKILL.md` (proyecto) y también en `.claude/skills/<nombre>/SKILL.md`. El archivo debe llamarse `SKILL.md` y tener frontmatter con `name` y `description` (Fuente: opencode.ai/docs/skills).
- **Skill propia:** `revisor-escenarios-turnos`.
  - Propósito: revisar la spec de un change de turnos contra `knowledge-base/05_reglas_de_negocio.md`.
  - Cuándo se activa: al proponer o revisar escenarios de un change.
  - Entradas: ruta de la spec y de las reglas de negocio.
  - Procedimiento: listar reglas RN involucradas, buscar ambigüedades y casos de borde faltantes, proponer escenarios CUANDO/ENTONCES.
  - Resultado: tabla de hallazgos con la regla RN citada.
  - Criterios de revisión: cada hallazgo cita una regla; los escenarios nuevos son verificables; no se inventan decisiones de dominio.

## 4. Comparación de dos servidores MCP
| | Context7 (Upstash) | Grep by Vercel |
|---|---|---|
| Propósito | Documentación actualizada y por versión de librerías | Buscar fragmentos de código en GitHub |
| Herramientas | `resolve-library-id` y `query-docs` | Pendiente de verificar |
| Conexión en OpenCode | Remoto: `https://mcp.context7.com/mcp` | Remoto (ejemplo en la doc de OpenCode); URL pendiente de verificar |
| Credenciales | API key opcional; la gratuita da más límite | Pendiente de verificar |
| Costo | Gratuito para este uso | Pendiente de verificar |
| Riesgos | Las consultas salen a un servicio externo: no pegar secretos ni datos de pacientes; las docs son aportadas por la comunidad | Pendiente de verificar |

**Elección: Context7.** Aporta lo que el change necesita (cómo documentar la API con OpenAPI/Swagger) y tiene herramientas claras. Límites: solo lectura de documentación, consultas con datos ficticios.

## 5. Instalación y comprobación
1. Revisar si ya está conectado: `opencode mcp list`.
2. Si no, agregar en `opencode.json` (remoto, sin secretos): `"mcp": { "context7": { "type": "remote", "url": "https://mcp.context7.com/mcp", "enabled": true } }`. La sintaxis puede variar según la versión de OpenCode; seguir la doc de la versión instalada.
3. Comprobar con `opencode mcp list` y ejecutando una herramienta real (`resolve-library-id`).
4. Si se usa API key: variable de entorno `CONTEXT7_API_KEY`, nunca en el repositorio.

## 6. Archivos de la fundación a actualizar
`.atl/skill-registry.md` (registrar la skill), `AGENTS.md` y `CLAUDE.md` (cuándo usar la skill y el MCP, límites), `README.md` (configuración reproducible del MCP), `CHANGES.md` (nuevo change), y la knowledge-base si cambia alguna regla.

## 7. Fuentes
- https://opencode.ai/docs/skills (consultada 2026-11-03)
- https://opencode.ai/docs/mcp-servers (consultada 2026-11-03)
- https://github.com/upstash/context7 (consultada 2026-11-03)

## Pendientes de verificar
Fuente del autor de `skill-creator`; datos de Grep by Vercel (herramientas, URL, credenciales, costo).
