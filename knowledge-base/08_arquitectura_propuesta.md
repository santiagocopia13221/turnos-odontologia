# Arquitectura Propuesta

## Patrones aplicados

| Patrón | Dónde se usa | Por qué |
|---|---|---|
| Arquitectura por capas | domain / application / infrastructure | Aísla la lógica de negocio de IO y del transporte |
| Puertos y adaptadores (hexagonal, liviano) | Repositorios y `Notificador` (WhatsApp) | Permite stubbear WhatsApp y cambiar la persistencia sin tocar el dominio |
| Inyección de dependencias | `turnosService` recibe repos + notificador | Testeable: se inyectan repos en memoria |
| Dominio puro | `domain/*` sin imports de infra | Reglas 100% testeables sin levantar servidor |

## Estructura de directorios

```
turnos-odontologia/
├── src/
│   ├── domain/
│   │   ├── turno.js            # entidad + invariantes
│   │   ├── disponibilidad.js   # cálculo de slots
│   │   └── reglas.js           # RN-TU / RN-CA (funciones puras)
│   ├── application/
│   │   ├── turnosService.js    # casos de uso (reservar, cancelar, reprogramar)
│   │   └── agendaService.js    # agenda y disponibilidad
│   ├── infrastructure/
│   │   ├── http/
│   │   │   └── server.js       # node:http + router + manejo de JSON/errores
│   │   ├── repos/
│   │   │   └── inMemoryRepos.js
│   │   └── notificaciones/
│   │       └── whatsappStub.js # adapter del puerto Notificador
│   └── index.js                # arranque (lee env, levanta server)
├── test/
│   ├── reglas.test.js
│   ├── turnos.test.js
│   └── agenda.test.js
├── package.json
└── README.md
```

## Seguridad

- **Autenticación**: no implementada en el MVP (ver DD-04). Los endpoints de staff quedan abiertos
  en desarrollo; a futuro, token/JWT.
- **Autorización**: matriz RBAC documentada en `03`, aún no enforce.
- **Validación de input**: validación de tipos y rangos en el borde (infrastructure) antes de llegar
  al dominio; el dominio valida invariantes de negocio.
- **Secrets management**: variables de entorno; ningún secreto en el repo (`.env` ignorado; en el
  MVP casi no hay secretos porque WhatsApp es stub).
- **Normalización**: teléfonos E.164; timestamps en tz AR (RN-GL-01).

## Variables de entorno

| Variable | Descripción | Ejemplo | Sensible |
|---|---|---|---|
| `PORT` | Puerto del servidor HTTP | `3000` | N |
| `TZ` | Zona horaria | `America/Argentina/Buenos_Aires` | N |
| `CANCELACION_MIN_HORAS` | Ventana mínima de cancelación (RN-CA-04) | `24` | N |
| `RECORDATORIO_HORAS_ANTES` | Anticipación del recordatorio (RN-RE-01) | `24` | N |
| `WHATSAPP_PROVIDER` | `stub` en el MVP | `stub` | N |
| `WHATSAPP_TOKEN` | Token del proveedor real (futuro) | — | Y |
| `WHATSAPP_PHONE_ID` | Phone number id (futuro) | — | Y |
