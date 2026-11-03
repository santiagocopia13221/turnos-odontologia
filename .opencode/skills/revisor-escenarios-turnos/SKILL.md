---
name: revisor-escenarios-turnos
description: Revisa los escenarios de la spec de un change de turnos odontológicos contra knowledge-base/05_reglas_de_negocio.md y detecta reglas ambiguas, contradicciones y casos de borde faltantes. Usala siempre que se proponga, revise, implemente o archive un change que toque turnos, solapamientos, disponibilidad, sillones, prestaciones, cancelación, reprogramación, reserva online o recordatorios, aunque el pedido no diga explícitamente "revisar escenarios". Entrega una tabla de hallazgos con la regla RN citada y escenarios CUANDO/ENTONCES verificables, sin inventar decisiones de dominio.
---

# Revisor de escenarios de turnos

Revisa la spec de un change contra las reglas de negocio y devuelve un informe accionable:
qué reglas están cubiertas, dónde hay ambigüedad y qué casos de borde faltan. El objetivo es
que un implementador y un tester puedan decidir sin reinterpretar el dominio.

## Cuándo usarla

- Al proponer un change nuevo (`/opsx:propose`) que toque turnos o agenda.
- Al revisar el `spec.md` de un change en curso o archivado.
- Al implementar o testear un change, para verificar que los escenarios cubren las reglas.
- No la uses para escribir la spec desde cero ni para hacer code review: acá se revisan
  escenarios de negocio y se proponen los faltantes.

## Entradas

1. **Spec del change**: ruta explícita. Si no la dan, buscala en
   `openspec/changes/<change>/specs/**/spec.md`. Si el change tiene varias specs, revisalas todas.
2. **Reglas de negocio**: por defecto `knowledge-base/05_reglas_de_negocio.md`.

Lecturas de apoyo (solo si hacen falta para entender alcance o decisiones pendientes):

- `openspec/changes/<change>/proposal.md` y `design.md` — alcance real del change.
- `knowledge-base/09_decisiones_y_supuestos.md` — decisiones (DD) y supuestos (SU) ya tomados.
- `knowledge-base/10_preguntas_abiertas.md` — decisiones de dominio NO resueltas.
- `knowledge-base/04_modelo_de_datos.md` — entidades, estados y campos.
- `openspec/specs/turnos/spec.md` — comportamiento ya establecido en la spec principal.

Si falta una ruta o no existe, pedila. No inventes el contenido de la spec ni de las reglas.

## Procedimiento

### 1. Leer y encuadrar el change

Leé la spec completa y el `proposal.md`/`design.md` si existen. Identificá:

- Qué operación o comportamiento agrega el change (crear, cancelar, reprogramar, consultar,
  asignar sillón, recordar, etc.).
- Qué requisitos y escenarios ya incluye.
- Qué reglas RN quedan dentro del alcance y cuáles pertenecen a otro change.

Una regla fuera de alcance no es un hallazgo: marcala como **fuera de alcance** con el motivo
(por ejemplo, RN-TU-06 corresponde a `franjas-y-bloqueos-agenda`, no a crear-turno).

### 2. Inventario de reglas involucradas

Recorré las reglas y armá la trazabilidad. Grupos disponibles en `05_reglas_de_negocio.md`:

| Grupo | Reglas | Tema |
|---|---|---|
| RN-TU | 01–09 | solapamientos, duración, franja, bloqueos, pasado, intervalos, cancelado |
| RN-PR | 01–03 | duración y prestación activa |
| RN-SI | 01–04 | sillón único, solapamiento, sillón activo, bloqueos |
| RN-CA | 01–04 | cancelación, reprogramación, estado, ventana configurable |
| RN-RO | 01–03 | paciente sin login, teléfono normalizado, asignación de sillón |
| RN-RE | 01–03 | recordatorios |
| RN-GL | 01–03 | zona horaria, IDs opacos, configuración por entorno |

Para cada requisito/escenario de la spec, anotá qué RN lo respalda. Para cada RN en alcance,
anotá si está **cubierta**, **parcial**, **ausente** o **ambigua**.

### 3. Matriz obligatoria de casos de borde

Verificá explícitamente estos casos antes de cerrar la revisión. Si el change no los toca porque
son de otro change, indicalo; si los toca y no están, es un hallazgo FALTANTE.

| Caso de borde | Regla | Qué debe quedar claro |
|---|---|---|
| Turno **contiguo** por profesional, sillón y paciente | RN-TU-08 | `fin == inicio` NO es solapamiento (intervalos semiabiertos). Debe haber escenario para las tres claves, no solo una. |
| Turno **cancelado** | RN-TU-09 | No bloquea solapamiento ni disponibilidad. Verificar en las tres claves y en reprogramación. |
| **Fecha en el pasado** | RN-TU-07 | Comparación contra un reloj inyectado; qué pasa si `inicio == ahora`; fechas con offset/zona. |
| **Duración inválida o manual** | RN-TU-04, RN-PR-01, RN-PR-03 | La duración se deriva de la prestación; el cliente no la envía; `<= 0` o no numérica se rechaza. |
| **Referencia inexistente** | RN-PR-02, RN-SI-03, RN-GL-02 | Profesional, sillón, prestación y paciente desconocidos; distinguir "no existe" de "inactivo". |
| **Franja de atención** | RN-TU-05 | Inicio o fin fuera de franja; día de la semana; cruce de medianoche si aplica. |
| **Bloqueo de agenda** | RN-TU-06, RN-SI-04 | Bloqueo del profesional y del sillón; también el caso contiguo al bloqueo. |
| **Solapamiento tripartito** | RN-TU-01, RN-TU-02, RN-TU-03, RN-SI-02 | Mismo intervalo por profesional, sillón y paciente; turnos en paralelo con sillones distintos. |
| **Estados del turno** | RN-TU-09, RN-CA-03 | Solo `RESERVADO` se cancela/reprograma; `CANCELADO` no bloquea. |
| **Ventana de cancelación** | RN-CA-01, RN-CA-04 | Borde exacto de 24 h; ventana configurable por entorno; reloj y zona horaria. |
| **Reprogramación** | RN-CA-02 | Revalida todas las reglas de reserva y conserva al paciente. |
| **Asignación de sillón** | RN-RO-03, SU-05 | Automática vs manual es decisión abierta: no la resuelvas por tu cuenta. |
| **Zona horaria** | RN-GL-01 | Fechas ISO 8601 con offset; instante vs hora local; cambios de día. |
| **Configuración** | RN-GL-03, RN-CA-04 | Zona horaria y ventana de cancelación por variables de entorno, no hardcodeadas. |
| **Recordatorios** | RN-RE-01, RN-RE-02, RN-RE-03 | Programación ~24 h antes; cancelación/reprogramación; envío simulado. |
| **Paciente online** | RN-RO-01, RN-RO-02 | Nombre + teléfono sin login; normalización E.164; reutilización por teléfono. |
| **Sillón único** | RN-SI-01, RN-SI-03 | Un turno ocupa exactamente un sillón; solo sillones activos. |

### 4. Buscar ambigüedades

Buscá frases que un implementador podría interpretar de más de una forma y confrontalas con la
regla citada:

- "superpuesto", "solapado", "se toca": ¿bordes abiertos o cerrados? RN-TU-08 exige semiabiertos.
- "ahora", "24 h antes", "en el pasado": ¿qué reloj, qué zona horaria, qué pasa en el borde exacto?
- "disponible", "sillón libre": ¿lo elige el sistema o la recepción? Es decisión abierta.
- "no cancelado", "activo": ¿qué estados exactos participan de cada validación?
- "referencia válida": ¿alcanza con que exista o debe estar activa? ¿Qué error se devuelve?
- "no se puede": ¿se rechaza con error tipado o se ignora silenciosamente?
- "duración": si la spec acepta una duración del cliente, contradice RN-TU-04/RN-PR-01.
- "mismo día", "día de la semana": depende de RN-GL-01; no asumas la zona del servidor.
- "reprogramar": debe comportarse como cancelar + crear conservando al paciente (RN-CA-02).
- "token", "autorización", "solo el paciente": es una decisión abierta (IN-02); no la inventes.

Cuando la ambigüedad esté en la propia regla de negocio, marcala como **regla ambigua** y citá el
archivo y la regla exacta. No la resuelvas unilateralmente: proponé la pregunta concreta.

### 5. Proponer escenarios CUANDO/ENTONCES

Cada escenario propuesto debe poder ejecutarse y dar un resultado observable:

- **CUANDO** [precondición concreta, con datos ficticios y valores observables]
- **ENTONCES** [resultado observable: estado, campo, error o efecto]

Reglas de redacción:

- Un comportamiento por escenario; nada de "y además".
- Valores concretos: fechas ISO 8601 con offset (`2026-11-10T10:00:00-03:00`), IDs ficticios,
  nombres ficticios. Nunca datos reales de pacientes (D6).
- Usá los nombres de estado y los códigos de error que ya use la spec; no inventes códigos nuevos.
- Evitá "funciona correctamente", "se valida bien" o detalles de implementación.
- Si el change es de dominio, hablá de errores de dominio; si es HTTP, del status y `error.code`
  que la spec defina. No mezcles capas.
- Si el caso depende de una decisión abierta, no escribas un ENTONCES que la afirme: mandalo a
  "Decisiones abiertas" como pregunta.

El repo usa `#### Scenario:` con `- **WHEN**` / `- **THEN**` (OpenSpec). En el informe usá
CUANDO/ENTONCES como se pidió. Si te piden insertar escenarios en la spec, respetá el formato y
los headings existentes, traduciendo solo las etiquetas sin cambiar la semántica.

### 6. Armar el informe

Usá exactamente esta estructura:

```markdown
## Revisión de escenarios — <change>

- Spec: <ruta>
- Reglas: <ruta>
- Alcance: <qué agrega el change>

### Reglas RN involucradas

| RN | Requisito / escenario que la cubre | Estado |
|---|---|---|
| RN-TU-01 | ... | cubierta / parcial / ausente / ambigua / fuera de alcance |

### Hallazgos

| # | Tipo | Severidad | Regla | Ubicación | Hallazgo | Escenario propuesto |
|---|---|---|---|---|---|---|
| 1 | AMBIGÜEDAD / FALTANTE / CONTRADICCIÓN | Alta / Media / Baja | RN-XX-NN | requisito o sección | qué falta o es ambiguo | **CUANDO** ... **ENTONCES** ... |

### Decisiones abiertas (no inventar)

| Pregunta | Regla / documento | Por qué bloquea |
|---|---|---|

### Cobertura de casos de borde

| Caso | Regla | ¿Cubierto? | Observación |
|---|---|---|---|

### Veredicto

BLOQUEANTE / CON OBSERVACIONES / OK — <una frase con el motivo>
```

Reglas del informe:

- **Cada hallazgo cita al menos una regla RN** de `05_reglas_de_negocio.md`. Si algo no se puede
  atar a una regla, va a "Decisiones abiertas" o se descarta; no es un hallazgo.
- No repitas escenarios que ya existen y son claros. Si existe pero es ambiguo, señalalo como
  AMBIGÜEDAD y proponé la corrección.
- No modifiques la spec ni agregues requisitos salvo pedido explícito: la salida es un informe.

## Criterios de revisión (definition of done)

- [ ] Cada hallazgo cita una regla RN concreta.
- [ ] Cada escenario propuesto es verificable: un tester puede decidir pass/fail sin interpretar.
- [ ] No se inventaron decisiones de dominio; las no resueltas quedaron como preguntas abiertas.
- [ ] Se usaron solo datos ficticios.
- [ ] Se distinguió "fuera de alcance" de "faltante".
- [ ] La matriz de casos de borde quedó respondida para el alcance del change.

## Ejemplo de hallazgo

| # | Tipo | Severidad | Regla | Ubicación | Hallazgo | Escenario propuesto |
|---|---|---|---|---|---|---|
| 1 | FALTANTE | Alta | RN-TU-08 | Requisito "Sin solapamiento por profesional" | La spec prueba solapamiento y contigüidad para profesional, pero no repite el borde contiguo para sillón ni paciente; un lector podría aplicar criterios distintos. | **CUANDO** el Sillón 1 tiene un turno que termina a las `2026-11-10T09:30:00-03:00` y se crea otro en el Sillón 1 que inicia a esa misma hora, **ENTONCES** la creación es exitosa porque `fin == inicio` no es solapamiento. |
