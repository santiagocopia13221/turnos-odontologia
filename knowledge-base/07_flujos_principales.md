# Flujos Principales

Cada flujo se documenta extremo a extremo, mostrando interacciones entre componentes.

## Flujo 1: Reserva online de un turno
**Disparador**: el paciente elige un horario disponible.
**Actor**: Paciente.

**Pasos**:
1. Cliente consulta `GET /disponibilidad?profesionalId=&prestacionId=&fecha`.
2. `application` calcula slots libres usando `domain/disponibilidad` (franjas − turnos − bloqueos).
3. Cliente envía `POST /turnos` (nombre, teléfono, prestación, profesional, inicio).
4. `application/turnosService` normaliza el teléfono y resuelve/crea el `Paciente` (RN-RO-02).
5. `domain/reglas` valida: solapamiento profesional/sillón/paciente, franja, pasado (RN-TU-01..07).
6. Se asigna el `Sillon` disponible (RN-RO-03) y se persiste el `Turno` (`RESERVADO`).
7. Se crea un `Recordatorio` `PENDIENTE` a `inicio − 24 h` (RN-RE-01).
8. Se responde `201` con el turno creado.

**Diagrama de secuencia**:
```
Paciente → HTTP → turnosService → reglas → repos(in-memory)
                                          ← Turno creado
Paciente ← HTTP ← 201 { turno }
```

**Casos de error**:
- Solapamiento → `409 Conflict` (`PROFESIONAL_OCUPADO` / `SILLON_OCUPADO` / `PACIENTE_OCUPADO`).
- Fuera de franja → `422 Unprocessable Entity` (`FUERA_DE_FRANJA`).
- En el pasado → `422` (`FECHA_EN_PASADO`).
- Datos inválidos → `400 Bad Request`.

## Flujo 2: Cancelación de un turno
**Disparador**: el paciente decide cancelar.
**Actor**: Paciente.

**Pasos**:
1. `POST /turnos/:id/cancelar`.
2. Se busca el turno; si no está `RESERVADO` → `409` (RN-CA-03).
3. Se valida anticipación ≥ 24 h (configurable) → si no, `422 CANCELACION_FUERA_DE_PLAZO` (RN-CA-01).
4. Se marca `CANCELADO` (libera agenda, RN-TU-09).
5. Se descarta/reprograma el recordatorio pendiente (RN-RE-02).
6. Se responde `200`.

**Casos de error**:
- Turno inexistente → `404 Not Found`.
- Fuera de plazo → `422`.

## Flujo 3: Reprogramación de un turno
**Disparador**: el paciente quiere otro horario.
**Actor**: Paciente.

**Pasos**:
1. `POST /turnos/:id/reprogramar` con el nuevo `fechaHoraInicio` (y opcional profesional).
2. Se validan todas las reglas de reserva (RN-CA-02), ignorando el propio turno en el chequeo de
   solapamiento.
3. Se actualiza inicio/fin y se reprograma el `Recordatorio` (RN-RE-02).
4. Se responde `200` con el turno actualizado.

**Casos de error**:
- Mismos que la reserva (solapamiento/franja/pasado).

## Flujo 4: Agenda diaria por profesional y sillón
**Disparador**: la recepción abre el día.
**Actor**: Recepcionista.

**Pasos**:
1. `GET /agenda?fecha=YYYY-MM-DD[&profesionalId=][&sillonId=]`.
2. Se listan los turnos `RESERVADO`/`COMPLETADO` de la fecha, con relaciones resueltas.
3. Se responde una lista (vista de grilla o de lista la arma el cliente futuro).

**Casos de error**:
- Fecha inválida → `400`.

## Flujo 5: Recordatorio de turno (job)
**Disparador**: proceso periódico (cron/loop).
**Actor**: Sistema.

**Pasos**:
1. El job busca `Recordatorio` `PENDIENTE` con `programadoPara <= ahora`.
2. Para cada uno, llama al puerto `Notificador` (adapter `whatsappStub` en MVP).
3. Marca `ENVIADO` (o `FALLIDO` si el adapter falla).
4. Si el turno ya fue cancelado, se saltea y descarta (RN-RE-02).

**Casos de error**:
- Falla del proveedor → estado `FALLIDO` + reintento (a definir, ver 10).
