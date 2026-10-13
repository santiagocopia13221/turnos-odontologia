<div class="portada">

# Informe de Discovery

## Sistema de gestión de turnos y agenda de pacientes para consultorios odontológicos (Argentina)

**Materia:** Metodología I

**Carrera:** Tecnicatura Universitaria en Programación — UTN

**Integrante:** Santiago Copia

**Fecha:** 13 de octubre de 2026

</div>

<div style="page-break-after: always;"></div>

## Resumen ejecutivo

**Qué se investigó.** Se relevaron 16 sistemas de gestión odontológica con agenda y turnos (Argentina primero, luego Latinoamérica e internacionales), a partir de sus sitios oficiales y páginas de precios. Se compararon agenda, reserva online, recordatorios, clínica, cobros, integraciones y precio, y se puntuó cada sistema con una matriz ponderada de 0 a 5. Lo que no está publicado se marcó "No evidenciado", y se distinguió la funcionalidad comprobada de la afirmación comercial.

**Principales hallazgos.** Los sistemas argentinos analizados (DentalSoft, DentalSaaS, Odonto.ar, Livio, DentalCore, DoctorYa) ya ofrecen como estándar reserva online, recordatorios por WhatsApp, odontograma e integración con obras sociales o ARCA, con precios publicados en pesos o dólares. El vacío más claro es que casi todos modelan "profesional + agenda" y pocos validan de forma explícita la doble ocupación de un sillón o box. Tampoco suelen ofrecer reglas de agenda configurables sin programar (ventana de cancelación, duración por prestación, franjas y bloqueos). Las cifras de reducción de ausentismo y de cantidad de clínicas son afirmaciones comerciales y no se tomaron como benchmark.

**MVP recomendado.** Reserva online sin login; agenda diaria por profesional y por sillón; prevención de solapamientos (mismo profesional y mismo sillón); duración variable por prestación; cancelación y reprogramación con mínimo de 24 horas; recordatorios por WhatsApp; franjas de atención y bloqueos. Quedan para etapas posteriores la facturación ARCA, obras sociales, cobros online, historia clínica completa, IA y multi-sucursal. El primer change implementado sobre este MVP fue "crear turno sin solapamientos".

<div style="page-break-after: always;"></div>


**Proyecto**: turnos-odontologia (consultorio con varios profesionales y varios sillones/boxes)
**Fecha del informe**: 2026-10-13
**Autor**: analista senior de producto SaaS · salud digital/odontología (LatAm, foco Argentina)
**Alcance**: Argentina primero, luego Latinoamérica e internacionales.
**Método de fuentes**: se **abrió la URL oficial** de cada uno de los 16 sistemas y se leyeron sus
datos en la página. Solo se cita lo leído; el resto se marca **"No evidenciado"**.
Se distingue **funcionalidad comprobada** (publicada en el sitio oficial) de **afirmación comercial**
(marketing sin verificación independiente). La moneda es la local de cada proveedor y la fecha de
consulta de todas las fuentes es **2026-10-13**. Detalle de la auditoría por URL en
`docs/discovery/checklist.md`.

---

## A) Tabla comparativa (16 sistemas, todos con URL oficial abierta)

> Leyenda de columnas: **Reserva online** (auto-agendado del paciente) · **Recordatorios** ·
> **Clínica** (historia clínica + odontograma) · **Cobros/Fact.** (caja, cobros, facturación) ·
> **Integr. locales** (WhatsApp / ARCA / obras sociales).

| # | Sistema | Proveedor / Origen | Segmento | Reserva online | Recordatorios | Clínica | Cobros / Fact. | Integr. locales | Precio (local) | Fuente |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | **DentalSoft** | DentalSoft · Argentina | Consultorios y clínicas (afirma 300+ en AR) | Sí, 24/7 desde web propia | WhatsApp + email; **automático solo en Pro** (Meta ~USD 0,026/msg) | Historias clínicas + odontograma (18 estados, FDI) | Caja/cobros (efectivo, tarjeta, transfer., MercadoPago, obra social) | WhatsApp, Google Calendar, MercadoPago, obras sociales | Gratis 3 meses (≤50 turnos/mes) · Gestión **AR$30.000/mes** · Pro **AR$60.000/mes** | https://www.dentalsoft.com.ar/ |
| 2 | **DentalSaaS** (Delriotech) | Delriotech · Argentina | Consultorio (1 sillón) → Clínica → Pro | Autogestión del paciente (plan Clínica+) | WhatsApp automático 24 h y 2 h antes (**requiere configuración adicional**) | HCE + odontograma + periodontograma + fichas por disciplina | Caja, cobros, obras sociales + nomenclador nacional, recetas PDF | WhatsApp, MercadoPago, obras sociales | Consultorio **AR$59.000/mes** · Clínica **AR$149.000/mes** · Pro **AR$349.000/mes** | https://dental.delriotech.com.ar/ |
| 3 | **Odonto.ar** | Odonto.ar · Argentina | Individual → clínica | Turnos online **con reglas** (anticipación mínima, duración por motivo, tope por paciente, cancelar/reprogramar) | WhatsApp | HCE + odontograma interactivo + trazabilidad legal | Obras sociales (cálculo de cobertura), presupuestos, finanzas | WhatsApp, obras sociales | Prueba 30 días; Individual **US$29 (1 u)** · Profesional **US$49 (5)** · Clínica **US$99 (10)**/mes | https://odonto.ar/ |
| 4 | **Livio** | Livio · Argentina | Clínicas (facturación ARS 5–20 M/mes) | Chatbot WhatsApp IA 24/7 (agenda) | WhatsApp/SMS/email (−40% ausentismo: **afirmación comercial**) | HCE + odontograma + firma digital + auditoría | Reportes; cobros (facturación **No evidenciada**) | WhatsApp (chatbot IA); "Ley 27.706" | Plan único **AR$99.000/mes** + 30 días gratis; Enterprise a medida | https://www.liviodental.com/ |
| 5 | **DentalCore** | DentalCore · AR/LatAm | Consultorio → multi-sucursal | Turnos online 24/7 + chatbot IA | Sí (detalle **No evidenciado**) | HCE + odontograma + periodontograma + dictado por voz | **Factura electrónica ARCA** + obras sociales (>20 convenios) | ARCA, obras sociales (PAMI, OSDE…), MercadoPago, WhatsApp oficial (API Meta) | **US$50/mes (2 usuarios) + US$10 por usuario**; sin plan gratis (14 días reembolso) | https://dentalcore.app/ |
| 6 | **DoctorYa** | DoctorYa · Argentina | Profesional → clínicas/sanatorios | Reserva online 24/7 + asistente conversacional | WhatsApp con CONFIRMAR/CANCELAR | Ficha del paciente + odontogramas + estudios | Comprobantes ARCA (Monotributo/RI); OS/copagos | WhatsApp, ARCA, obras sociales | Argenti **AR$9.000 (1 agenda)** · Aurum **AR$25.000 (5 agendas)** · (3er plan **AR$90.000**, rótulo repetido en el sitio) | https://doctorya.com.ar/ |
| 7 | **Dentiqa** | Violet Wave · LatAm/AR | Clínicas | Agenda multi-dentista con bloqueos por profesional (booking **No evidenciado**) | WhatsApp IA (Claude) | HCE + odontograma + periodontograma + firma electrónica | CRM/campañas; facturación (detalle **No evidenciado**) | WhatsApp IA, multi-clínica (Enterprise) | Starter **US$89** · Professional **US$149** · Enterprise **US$249**/mes | https://dentiqa.app/ |
| 8 | **Dentalink** | Dentalink · Chile/LatAm (+AR, MX; +20 países) | Consultorio → clínica multi-sede | Agendamiento online | Notificaciones email/WhatsApp; confirmación de citas | HCE + odontograma + periodontograma + ortodoncia + firma | Pagos online, financiamiento, reembolsos, POS | WhatsApp/email, pagos; Ley 26.529 (AR) | Cotización (planes Esencial/Pro/Titanium; **precio no público**) | https://www.softwaredentalink.com/ |
| 9 | **Mi Agenda Dental** | Mi Agenda Dental · México | Clínica / por unidad (sillón) / dentista | Agenda; auto-agendado **No evidenciado** | WhatsApp: confirmaciones y pre-registro | Expediente + odontograma + periodontograma (NOM-013) | Cobros, presupuestos con link, recetas; CFDI con Premium | WhatsApp; Google Calendar; CFDI | Inicio **$99** / Estándar **$199** / Plus **$399** / Premium **$699** / Clínica desde **$349** / Empresarial **$2.500** MXN/mes | https://miagendadental.com/ |
| 10 | **Agenda Clínica** (AgendaClinica) | AgendaClinica · Chile | Profesional/consulta (incl. odontología) | Agenda online pública | WhatsApp y correo ilimitados + confirmación/cancelación | Fichas personalizables + odontograma (plan Dental) | Presupuestos; vinculación MercadoPago | WhatsApp, correo, MercadoPago | Profesional Salud **CLP $14.990** · Odontológico **CLP $19.990/mes** (+4.990/usuario) | https://www.agendaclinicas.cl/ |
| 11 | **Simples Dental** | Simples Dental · Brasil | "Nº1 de Brasil"; afirma +19 mil clínicas | Agenda online + "Secretária IA" 24/7 por WhatsApp | WhatsApp; control por voz (Alexa) | Prontuário digital + odontograma + firma electrónica | Financeiro, boleto, Pix, comissões | WhatsApp, Pix, maquininha (Saúde Service), IA | **No público** en la home (link a /planos-e-precos); prueba 7 días | https://www.simplesdental.com/ |
| 12 | **Clinicorp** | Clinicorp · Brasil | Clínicas medianas/grandes | Gestión de agenda + self-check-in QR | Confirmación automática por WhatsApp | Prontuário digital; fichas; Clinicorp IA | Gestión financiera, stock, reportes | WhatsApp; Clinicorp IA | Standard **R$149,90/mes** · Premium **R$369,90/mes** (en FAQ) | https://clinicorp.com/ |
| 13 | **Dentally** | Dentally · Reino Unido (AU/CA/IE/NZ) | Prácticas 1 → multisite (NHS) | Dentally Portal (online booking, forms, kiosk) | SMS/email + short-notice scheduling | Charting + perio + AI notes + imaging | Cuentas/claims NHS; reporting | Approved partners; NHS; marketplace | Starter **£125–265** / Essentials **£220–380** / Pro **£320–510**/mes (1/2/3 surgeries, +VAT) | https://www.dentally.com/en-gb/pricing |
| 14 | **Curve Dental** | Curve Dental (CD Newco) · US/Canada | Startups → multi-location | Patient self-scheduling | Curve GRO (text/email) | Charting, perio, imaging, treatment planning | Insurance/claims, Curve Pay, analytics | Ecosistema US (Dental Intelligence, pagos) | Cotización (**precio no público**) | https://www.curvedental.com/ |
| 15 | **Open Dental** | Open Dental Software · US (núcleo open source) | Cualquier tamaño | Web Sched (portal + online scheduling) vía eServices | Automated Messaging (texting, eReminders) | Graphical tooth chart, perio, eRx | Billing/claims vía clearinghouses; pagos | eServices bundle; API/bridges | **No evidenciado** en la home (página Order) | https://www.opendental.com/ |
| 16 | **Cliniko** | Cliniko · Australia (95+ países) | Allied health/clínicas (no dental-específico) | Online bookings 24/7 configurable | SMS/email + wait list | Treatment notes (SOAP) — **sin odontograma** | Invoicing, finance; Stripe | API; multi-location | **US$45** (1) · 95 (2–5) · 145 (6–8) · 195 (9–12) · 295 (13–25) · 395 (26–200)/mes | https://www.cliniko.com/pricing |

### Sistemas NO evidenciados (URL oficial no abierta en esta sesión)

Aparecieron en resultados de búsqueda pero **no se abrió su sitio oficial**: quedan **fuera** de la
tabla comparativa y del scoring. Se listan solo como pista para una futura ampliación.

| Sistema | Origen | Por qué queda afuera |
|---|---|---|
| Dentrix / Dentrix Ascend / EagleSoft | US | No se abrió el sitio del proveedor |
| tab32 | US | No se abrió el sitio del proveedor |
| Doctolib | Francia/EU | No se abrió el sitio oficial |
| DenPro (AR/CO) | AR/CO | No se abrió el sitio oficial |
| SmileSys | México | No se abrió el sitio oficial |
| OralDrive | Colombia | No se abrió el sitio oficial |
| EIR DR. | Colombia | No se abrió el sitio oficial |
| Dentidesk | Chile | No se abrió el sitio oficial |
| Dentalware | Chile | No se abrió el sitio oficial |
| Bilog | Argentina | No se abrió el sitio oficial |
| ClinIA / OdontoClinIA | Argentina | No se abrió el sitio oficial |
| AxisMed | Argentina | No se abrió el sitio oficial |
| DentalFLOW | Argentina | No se abrió el sitio oficial |
| Turnito / ReservaSimple / iTurnos | Argentina | No se abrió el sitio oficial |

---

## B) Matriz de puntuación (0–5) con pesos

**Nota metodológica.** La puntuación es **juicio de analista** a partir de información pública
oficial **leída en los sitios de A** (cada uno con su URL abierta), no de una prueba de producto.
Cada criterio se puntúa **0–5** (0 = ausente/no evidenciado, 5 = referente). Los pesos reflejan el
caso de uso de **turnos-odontologia** (consultorio argentino, multi-profesional y **multi-sillón**,
WhatsApp y facturación/obras sociales locales). Donde el dato no está publicado, aplica
**"No evidenciado"** (no se premia).

| Criterio | Peso | Qué mide |
|---|---|---|
| Agenda y automatización | 25 % | Agenda multi-agenda, prevención de solapamiento, duración variable, bloqueos, automatización |
| Clínica | 20 % | Historia clínica + odontograma + periodontograma + fichas por especialidad |
| Integraciones locales y WhatsApp | 15 % | WhatsApp nativo + ARCA/obras sociales (penaliza fuerte a los internacionales) |
| Administración y facturación | 15 % | Caja, cobros, presupuestos, nomenclador/obras sociales, reportes |
| Experiencia del paciente | 10 % | Auto-agendado sin fricción, confirmación/cancelación, recordatorios |
| Seguridad | 10 % | Cifrado, roles/permisos, auditoría, cumplimiento (ley de HC) |
| Precio / valor | 5 % | Transparencia y relación precio-funcionalidad (no incluye "¿es barato?") |

| # | Sistema | Agenda (25) | Clínica (20) | Integr. local (15) | Admin/Fact. (15) | Paciente (10) | Seguridad (10) | Precio (5) | **Score** |
|---|---|---|---|---|---|---|---|---|---|
| 3 | **Odonto.ar** | 5 | 5 | 4 | 5 | 4 | 4 | 5 | **4,65** |
| 8 | **Dentalink** | 5 | 5 | 4 | 5 | 4 | 5 | 3 | **4,65** |
| 2 | **DentalSaaS** | 5 | 5 | 4 | 5 | 4 | 4 | 4 | **4,60** |
| 5 | **DentalCore** | 4 | 5 | 5 | 5 | 4 | 4 | 4 | **4,50** |
| 7 | **Dentiqa** | 5 | 5 | 4 | 4 | 4 | 4 | 3 | **4,40** |
| 11 | **Simples Dental** | 5 | 5 | 3 | 5 | 4 | 4 | 3 | **4,40** |
| 4 | **Livio** | 5 | 4 | 5 | 4 | 4 | 4 | 3 | **4,35** |
| 6 | **DoctorYa** | 5 | 3 | 5 | 4 | 5 | 3 | 4 | **4,20** |
| 9 | **Mi Agenda Dental** | 5 | 4 | 3 | 5 | 3 | 4 | 5 | **4,20** |
| 1 | **DentalSoft** | 5 | 3 | 5 | 4 | 4 | 3 | 4 | **4,10** |
| 12 | **Clinicorp** | 4 | 5 | 3 | 5 | 3 | 4 | 4 | **4,10** |
| 14 | **Curve Dental** | 4 | 4 | 2 | 5 | 5 | 5 | 2 | **3,95** |
| 13 | **Dentally** | 4 | 4 | 2 | 4 | 5 | 5 | 2 | **3,80** |
| 15 | **Open Dental** | 4 | 4 | 2 | 4 | 4 | 5 | 3 | **3,75** |
| 10 | **Agenda Clínica** | 4 | 3 | 4 | 3 | 3 | 3 | 5 | **3,50** |
| 16 | **Cliniko** | 4 | 3 | 1 | 3 | 4 | 4 | 4 | **3,20** |

**Lectura de la matriz**: los internacionales (Curve, Dentally, Open Dental, Cliniko) son
referentes de UX/seguridad, pero su **integración local (WhatsApp + ARCA + obras sociales)** los
hunde para el caso argentino. Los mejores puntajes combinan agenda fuerte + clínica completa +
integración local (Odonto.ar, Dentalink, DentalSaaS, DentalCore, Dentiqa, Livio).

> Los puntajes no deben leerse como "verdad": son una hipótesis de priorización para elegir
> demos. El criterio decisivo para este proyecto es **agenda multi-agenda por profesional y
> sillón + WhatsApp + reglas de negocio configurables**, no la profundidad clínica.
> Corrección respecto a la primera versión: **Odonto.ar** sube de 4,30 a 4,65 al verificarse en su
> página que los **turnos online tienen reglas** (anticipación, duración por motivo, tope).

---

## C) Análisis competitivo

### C.1 Estándar de mercado (tabla de base)

Lo que hoy **no se puede omitir** si el producto se posiciona como software odontológico:

1. **Auto-agendado del paciente 24/7** (link propio, sin app y —cada vez más— sin login, con
   teléfono/DNI).
2. **Recordatorios y confirmación por WhatsApp** que actualizan la agenda cuando el paciente
   confirma o cancela (el argumento nº1 contra el ausentismo).
3. **Historia clínica digital + odontograma** (y periodontograma desde gama media).
4. **Caja, cobros y obras sociales** (nomenclador, planillas por OS); en AR, facturación ARCA.
5. **Agenda multi-profesional** y multi-sede en gama media/alta.
6. **Duración de turno por tipo de prestación** y bloqueos de horario.

### C.2 Diferenciadores observados por sistema

- **DentalSaaS (AR)**: modela explícitamente el **eje por profesional y por sillón** y precios
  claros por plan; fuerte en obras sociales y nomenclador.
- **Odonto.ar (AR)**: turnos online **con reglas** (anticipación, duración por motivo, tope) a
  precio accesible — el auto-agendado "con reglas" más transparente de los AR.
- **DoctorYa / Dentiqa / Livio (AR)**: **asistente/chatbot IA de WhatsApp** como frente de venta.
- **Mi Agenda Dental (MX)**: separa **clínica / unidad (sillón) / dentista** y cobra por sillón —
  el mejor **modelo mental** para el caso de este proyecto.
- **Dentalink (LatAm)**: la **ficha clínica + financiero** más maduro de la región; escala
  consultorio→clínica→multi-sede y lidera en notoriedad.
- **Dentally / Curve (int.)**: mejor **experiencia de paciente** (Portal, self-scheduling,
  digital forms, short-notice filling) y automatización de recordatorios/recalls.
- **Clinicorp / Simples Dental (BR)**: volumen y ecosistema financiero (Pix, boleto) — referencia
  de escala regional, menos relevante para AR.

### C.3 Vacíos en Argentina (oportunidades)

1. **Sillón como ciudadano de primera clase**: casi todos los AR modelan "profesional + agenda";
   muy pocos validan **doble ocupación de sillón/box**. Este es exactamente el dolor declarado en
   Discovery y una regla que aquí es "sí o sí".
2. **Reglas de agenda configurables sin programar**: ventana mínima de cancelación (≥24 h),
   duración por prestación, franjas/bloqueos, feriados. Suelen estar hardcodeadas o ausentes.
3. **Agenda multi-sillón + multi-profesional en un solo panel** para recepción, con vista
   combinada — la mayoría lo tiene parcial (solo por profesional).
4. **Precios transparentes y en pesos**: los líderes LatAm/AR fuerzan "solicitud de cotización".
   Publicar planes en ARS es un diferencial de confianza.
5. **Onboarding sin fricción** (sin tarjeta, datos de prueba, migración desde Excel) — DentalSoft y
   Odonto.ar ya lo ofrecen; sigue siendo oportunidad frente a los líderes que cotizan.

### C.4 Riesgos competitivos

- **Comoditización del auto-agendado + WhatsApp**: es el estándar, no el diferenciador. Competir
  "por tener WhatsApp" es competir por precio.
- **Gigantes de la región** (Dentalink, Simples Dental, Clinicorp) con escala, marca y financiamiento.
- **IA como feature de marketing**: muchos anuncian chatbots IA (afirmación comercial) sin evidencia
  de calidad; el riesgo es sobredimensionar la IA en el MVP.

---

## D) Recomendación

### D.1 Cinco competidores para demo (foco Argentina, multi-profesional + WhatsApp + OS/ARCA)

1. **DentalSaaS (AR)** — referencia directa por eje profesional/sillón + planes transparentes + OS.
   (https://dental.delriotech.com.ar/)
2. **DentalSoft (AR)** — mejor relación auto-agendado + WhatsApp + Google Calendar + MercadoPago.
   (https://www.dentalsoft.com.ar/)
3. **DentalCore (AR/LatAm)** — facturación ARCA + obras sociales + odontograma/periodontograma.
   (https://dentalcore.app/)
4. **Odonto.ar (AR)** — auto-agendado con reglas a precio accesible.
   (https://odonto.ar/)
5. **DoctorYa (AR)** — planes escalonados y facturación ARCA desde el plan base.
   (https://doctorya.com.ar/)

> Complemento LatAm optativo: **Dentalink** (benchmark de ficha clínica/financiero) y
> **Mi Agenda Dental** (modelo de datos por sillón).

### D.2 Tres referencias de UX

1. **Mi Agenda Dental (MX)** — cómo estructurar **clínica / sillón / dentista** y cobrar por sillón.
2. **Dentalink (LatAm)** — flujo agendar → ficha → cobro en una sola columna, para roles no técnicos.
3. **Dentally Portal (UK)** — experiencia del paciente: booking, digital forms, kiosk y
   confirmación sin fricción.

### D.3 MVP — tres listas

**Imprescindible (MVP)**
- Reserva online **sin login** (nombre + teléfono).
- **Agenda diaria por profesional y por sillón**, en un solo panel para recepción.
- **Prevención de solapamiento**: mismo profesional y mismo sillón.
- **Duración variable por prestación**.
- **Cancelación/reprogramación** con regla mínima de **24 h**.
- **Recordatorios por WhatsApp** con confirmación/cancelación que actualiza la agenda.
- **Franjas de atención / bloqueos** (incluye almuerzo) y roles (recepción, odontólogo).

**Diferenciador**
- **Modelo sillón-first** con validación explícita de doble ocupación de box.
- **Reglas de agenda configurables** (ventana de cancelación, duraciones, franjas) sin código.
- **Vista combinada profesional + sillón** (grilla y lista) para recepción.
- **Confirmación por WhatsApp que reagenda sola** y lista de espera / sobreturnos.
- **Precios en ARS publicados** y onboarding sin tarjeta.

**Etapas posteriores**
- **Facturación ARCA + obras sociales** (nomenclador, planillas).
- **Cobros online / señas** (MercadoPago).
- **Historia clínica completa + periodontograma** y ficha por especialidad.
- **IA** (chatbot de WhatsApp, dictado de evolución).
- **Multi-sucursal / multi-tenant**; **portal del paciente** y **reportes financieros**.

### D.4 "Comprobado" vs "Afirmación comercial" (dónde desconfiar)

- **Comprobado** (leído en el sitio oficial, URL abierta): planes y precios (DentalSoft, DentalSaaS,
  Odonto.ar, Livio, DentalCore, DoctorYa, Dentiqa, Mi Agenda Dental, Agenda Clínica, Clinicorp,
  Dentally, Cliniko), features listadas (auto-agendado, WhatsApp, odontograma, ARCA/OS), plataforma
  cloud. Donde el precio no está publicado, se marcó **"No evidenciado"** (Simples Dental,
  Dentalink, Curve, Open Dental).
- **Afirmación comercial** (no verificable independientemente): reducciones de ausentismo
  ("−82%", "−40%"), "+300 clínicas", "+19 mil clínicas", "+32 mil clínicas", "reemplaza a X",
  "IA que agenda sola". Tratar como hipótesis a validar en demo, no como benchmark.

---

## Fuentes

### Fuentes abiertas y verificadas (2026-10-13)

https://www.dentalsoft.com.ar/ · https://dental.delriotech.com.ar/ · https://odonto.ar/ ·
https://www.liviodental.com/ · https://dentalcore.app/ · https://doctorya.com.ar/ ·
https://dentiqa.app/ · https://www.softwaredentalink.com/ · https://miagendadental.com/ ·
https://www.agendaclinicas.cl/ · https://www.simplesdental.com/ · https://clinicorp.com/ ·
https://www.dentally.com/en-gb/pricing · https://www.curvedental.com/ · https://www.opendental.com/ ·
https://www.cliniko.com/pricing

### Fuentes NO abiertas en esta sesión (No evidenciado)

tab32.com · info.doctolib.fr · denpro.ar · denpro.co · smilesys.com.mx · oraldrive.com · eirdr.com ·
dentidesk.cl · dentalware.cl · bilog.com.ar · clinia.com.ar · axismed.com.ar · dentalflow.ar ·
turnito.app · reservasimple.com · iturnos.ar

Detalle de la auditoría URL por URL en `docs/discovery/checklist.md`.

<div style="page-break-after: always;"></div>

## Verificación de fuentes

**Qué se hizo.** Después de que el agente generó el informe, abrí personalmente en el navegador las 16 URLs oficiales citadas. Las 16 cargan y corresponden al sistema indicado. Además, para los 6 primeros sistemas (los argentinos) comparé lo que el informe afirma (planes, precios, funcionalidades) contra lo que dice la página, y coincidía.

**Alcance honesto.** Para los sistemas 7 a 16 verifiqué que la URL existe y corresponde al producto, pero no contrasté afirmación por afirmación (precios, funcionalidades) del informe contra cada página. Los datos de esos sistemas deben tomarse como "abiertos por el agente, URL confirmada por el estudiante". Las cifras de ausentismo y de cantidad de clínicas son afirmaciones comerciales del proveedor y no fueron verificadas de forma independiente.

| # | Sistema | URL | ¿Abre y corresponde? | ¿Afirmaciones contrastadas con la página? | Corrección |
|---|---|---|---|---|---|
| 1 | DentalSoft | https://www.dentalsoft.com.ar/ | Sí | Sí, coincide | Ninguna |
| 2 | DentalSaaS | https://dental.delriotech.com.ar/ | Sí | Sí, coincide | Ninguna |
| 3 | Odonto.ar | https://odonto.ar/ | Sí | Sí, coincide | Ninguna |
| 4 | Livio | https://www.liviodental.com/ | Sí | Sí, coincide | Ninguna |
| 5 | DentalCore | https://dentalcore.app/ | Sí | Sí, coincide | Ninguna |
| 6 | DoctorYa | https://doctorya.com.ar/ | Sí | Sí, coincide | Ninguna |
| 7 | Dentiqa | https://dentiqa.app/ | Sí | No contrastado | Ninguna |
| 8 | Dentalink | https://www.softwaredentalink.com/ | Sí | No contrastado | Ninguna |
| 9 | Mi Agenda Dental | https://miagendadental.com/ | Sí | No contrastado | Ninguna |
| 10 | Agenda Clínica | https://www.agendaclinicas.cl/ | Sí | No contrastado | Ninguna |
| 11 | Simples Dental | https://www.simplesdental.com/ | Sí | No contrastado | Ninguna |
| 12 | Clinicorp | https://clinicorp.com/ | Sí | No contrastado | Ninguna |
| 13 | Dentally | https://www.dentally.com/en-gb/pricing | Sí | No contrastado | Ninguna |
| 14 | Curve Dental | https://www.curvedental.com/ | Sí | No contrastado | Ninguna |
| 15 | Open Dental | https://www.opendental.com/ | Sí | No contrastado | Ninguna |
| 16 | Cliniko | https://www.cliniko.com/pricing | Sí | No contrastado | Ninguna |

**Hallazgos durante la revisión.** Antes de aprobar el Discovery, el agente había asumido un consultorio de un solo profesional y había entregado solo el checklist sin investigación de mercado; ambas cosas se corrigieron con la opción Ajustar. En la knowledge-base se agregaron además los puntos "No evidenciado" a las preguntas abiertas.

## Referencias

Las fuentes consultadas (fecha de consulta 2026-10-13) son las 16 URLs oficiales de la tabla anterior. Las fuentes que no se abrieron en la sesión figuran como "No evidenciado" en la sección de fuentes del informe.
