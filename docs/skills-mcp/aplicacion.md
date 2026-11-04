# Informe de aplicación: Skills + MCP sobre el change C-05b
Autor: Santiago Copia (trabajo individual). Repositorio: https://github.com/santiagocopia13221/turnos-odontologia

## 1. Qué se hizo
Se integró una skill propia y un servidor MCP a la fundación del proyecto y se usaron para PREPARAR (no implementar) el change C-05b `api-minima-turnos-openapi` (POST /turnos, GET /openapi.json, GET /docs). C-05b sigue pendiente (`[ ]`) en CHANGES.md. Depende de C-05 (servidor HTTP), que todavía no está implementado.

## 2. Resultados
- Skill propia `revisor-escenarios-turnos` (.opencode/skills/revisor-escenarios-turnos/SKILL.md): creada con `skill-creator` y validada con quick_validate.py. Revisa la spec contra knowledge-base/05_reglas_de_negocio.md y entrega tabla de hallazgos con RN-XX, escenarios CUANDO/ENTONCES, decisiones abiertas y veredicto. Registrada en .atl/skill-registry.md y referenciada en AGENTS.md/CLAUDE.md.
- C-05b: veredicto BLOQUEANTE en la primera revisión, CON OBSERVACIONES en la segunda. Se resolvieron duración enviada por el cliente, prelación de códigos 409 y contigüidad; se dejó abierta la validación de referencias inactivas. En design se agregaron D8 (Swagger UI 5.11.0), D11 y D12.
- MCP Context7 (remoto, sin credenciales): usado para validar D7 y D8 (archivos CDN y opción `url` de SwaggerUIBundle).
- Prueba en sesión nueva: la skill se activó sin nombrarla.
- Evidencias: [revision-c05b-antes.md](evidencias/revision-c05b-antes.md), [revision-c05b-despues.md](evidencias/revision-c05b-despues.md), [revision-c05b-final.md](evidencias/revision-c05b-final.md), [revision-c05b-verificada.md](evidencias/revision-c05b-verificada.md), [mcp-context7-uso.md](evidencias/mcp-context7-uso.md), [prueba-skill-sesion-nueva.md](evidencias/prueba-skill-sesion-nueva.md), [capturas/](evidencias/capturas/).

## 3. Archivos modificados y motivo
| Archivo(s) | Cambio | Motivo |
|---------|--------|--------|
| .opencode/skills/revisor-escenarios-turnos/SKILL.md | Agregado | Skill propia del proyecto. |
| .atl/skill-registry.md | Modificado | Registrar la skill. |
| AGENTS.md y CLAUDE.md | Modificados | Referenciar la skill y agregar la sección MCP; se mantienen idénticos. |
| README.md | Modificado | Sección de integración MCP, sección de la skill y requisito Node 20 (antes decía 18). |
| opencode.json | Agregado | Configuración reproducible del MCP Context7, sin secretos. |
| CHANGES.md | Modificado | Estado y dependencias del change C-05b. |
| openspec/changes/c-05b-api-minima-turnos-openapi/ (proposal, design, spec, tasks, .openspec.yaml) | Agregados | Artefactos del change preparado con SDD. |
| docs/skills-mcp/investigacion.md | Agregado | Ficha de investigación. |
| docs/skills-mcp/evidencias/*.md | Agregados | Las 4 revisiones de la skill, el uso de Context7 y la prueba en sesión nueva. |
| docs/skills-mcp/evidencias/capturas/ | Agregado | Capturas de evidencia. |

## 4. Revisión crítica de la IA (errores detectados y corrección)
1. **Ejemplo con fecha en el pasado en C-05b.** Detectado por la skill (RN-TU-07) en [revision-c05b-antes.md](evidencias/revision-c05b-antes.md).  
   ANTES: `git show 6857e0a:.../spec.md` con `2026-10-20T09:00:00-03:00` sin reloj inyectado.  
   DESPUÉS: reloj inyectado `2026-11-03T12:00:00-03:00` y `2026-11-10T09:00:00-03:00`, formato UTC en respuestas.
2. **Context7 "Library not found" para OpenAPI.** Context7 devolvió "Library not found" tras 4 intentos de `resolve-library-id`. Se contrastó con la especificación oficial OpenAPI 3.0.3 (https://spec.openapis.org/oas/v3.0.3.html).  
   ANTES: afirmación sin fuente.  
   DESPUÉS: afirmación respaldada por la especificación oficial, registrada en [mcp-context7-uso.md](evidencias/mcp-context7-uso.md).
3. **Omisión sobre la opción `url` de SwaggerUIBundle.** Se corrigió repitiendo la consulta y documentándola.
4. **D8 con versión mayor flotante.** Según la documentación oficial de Swagger UI, se usa versión exacta 5.11.0.  
   ANTES: version mayor flotante.  
   DESPUÉS: versión exacta 5.11.0 en [design.md](../../openspec/changes/c-05b-api-minima-turnos-openapi/design.md).

## 5. Limitaciones
- Context7 falló en 4 intentos de `resolve-library-id` y devolvió "Library not found" para OpenAPI: no sirve como fuente única.
- La skill no es determinística: revisión "verificada" dio OK sin volver a evaluar 5 hallazgos de baja severidad, mientras la sesión nueva dio CON OBSERVACIONES. El veredicto que se sostiene es CON OBSERVACIONES. Marcó como "faltantes críticas" reglas fuera de alcance (RN-TU-05, RN-TU-06, RN-SI-04, a cargo de C-02).
- Decisiones abiertas: quién valida Prestacion.activo/Sillon.activo y con qué código, y asignación de sillón manual o automática.
- Swagger UI 5.11.0 tomado del ejemplo oficial; no se verificó si es la última publicada.
- C-05b no se implementó, por lo que nada fue probado en ejecución.
