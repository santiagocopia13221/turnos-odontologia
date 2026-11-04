# turnos-odontologia
Sistema de gestión de turnos para consultorios odontológicos (Argentina). Change implementado: crear turno sin solapamientos por profesional y por sillón.

## Requisitos
Node.js 20 o superior. No usa dependencias externas.

## Instalar y correr los tests
git clone URL-DEL-REPO
cd turnos-odontologia
npm test

Todos los datos de ejemplo son ficticios.

## Integración MCP (Context7)

- **Qué es y para qué se usa:** Servidor MCP remoto que consulta documentación actualizada de librerías (Swagger UI, OpenAPI) mientras se prepara el change C-05b.
- **Requisitos:** OpenCode instalado y conexión a internet. No requiere instalar paquetes.
- **Pasos:** La configuración está en `opencode.json` en la raíz del repo (URL `https://mcp.context7.com/mcp`, type `remote`); abrir OpenCode parado en la raíz del repo.
- **Comprobación:** Ejecutar `opencode mcp list` y verificar que `context7` figure conectado; `opencode mcp debug context7` para diagnóstico.
- **Variables de entorno:** `CONTEXT7_API_KEY` es OPCIONAL y NO hace falta para reproducir esta entrega; si alguien la usa, debe definirla como variable de entorno del sistema y nunca escribirla en archivos del repo. La forma exacta de pasarla a OpenCode se consulta en https://docs.opencode.ai/docs/mcp-servers .
- **Límites:** Solo lectura de documentación; las consultas salen a un servicio externo, por eso no se pegan secretos ni datos de pacientes; todos los datos del proyecto son ficticios.

## Skill propia: revisor-escenarios-turnos

- **Qué hace:** Revisa los escenarios de la spec de un change de turnos contra `knowledge-base/05_reglas_de_negocio.md`, detecta reglas ambiguas, contradicciones y casos de borde faltantes, y propone escenarios CUANDO/ENTONCES con la regla RN citada.
- **Ubicación:** `.opencode/skills/revisor-escenarios-turnos/SKILL.md`
- **Cómo probarla:** Pedirle a OpenCode que revise la spec de un change de turnos (ej. `openspec/changes/c-05b-api-minima-turnos-openapi/specs/api-turnos/spec.md`).