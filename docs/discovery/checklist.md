# Checklist de verificación — Investigación de mercado

**Proyecto**: turnos-odontologia · **Fecha**: 2026-10-13
**Acompaña a**: `docs/discovery/informe-discovery.md`
**Regla**: solo se cita lo que se **leyó abriendo la URL oficial** en esta sesión. Lo que no se abrió
va a **"No evidenciado"**. No se inventa nada.

---

## 1) Auditoría de URLs — ¿abrí la URL oficial en esta sesión?

| # | Sistema | URL oficial | ¿Abierta en esta sesión? |
|---|---|---|---|
| 1 | DentalSoft | https://www.dentalsoft.com.ar/ | **Sí** |
| 2 | DentalSaaS | https://dental.delriotech.com.ar/ | **Sí** |
| 3 | Odonto.ar | https://odonto.ar/ | **Sí** |
| 4 | Livio | https://www.liviodental.com/ | **Sí** |
| 5 | DentalCore | https://dentalcore.app/ | **Sí** |
| 6 | DoctorYa | https://doctorya.com.ar/ | **Sí** |
| 7 | Dentiqa | https://dentiqa.app/ | **Sí** |
| 8 | Dentalink | https://www.softwaredentalink.com/ | **Sí** |
| 9 | Mi Agenda Dental | https://miagendadental.com/ | **Sí** |
| 10 | Agenda Clínica | https://www.agendaclinicas.cl/ | **Sí** |
| 11 | Simples Dental | https://www.simplesdental.com/ | **Sí** |
| 12 | Clinicorp | https://clinicorp.com/ | **Sí** |
| 13 | Dentally | https://www.dentally.com/en-gb/pricing | **Sí** |
| 14 | Curve Dental | https://www.curvedental.com/ | **Sí** |
| 15 | Open Dental | https://www.opendental.com/ | **Sí** |
| 16 | Cliniko | https://www.cliniko.com/pricing | **Sí** |

**Total: 16 sistemas, 16 URLs abiertas y verificadas.** (Antes de esta auditoría el informe se había
armado con resultados de buscador, no con las URLs abiertas; eso quedó corregido.)

## 2) Ledger de fuentes (URL abierta · dato verificado en la página)

| Sistema | URL abierta | Dato verificado (leído en la página) |
|---|---|---|
| DentalSoft | https://www.dentalsoft.com.ar/ | Agenda multi-profesional; odontograma (18 estados, FDI); WhatsApp con confirmación que actualiza la agenda; **Precio: Gratis 3 meses (≤50 turnos/mes) · Gestión AR$30.000/mes · Pro AR$60.000/mes**; WhatsApp automático solo en Pro (Meta cobra USD 0,026/mensaje) |
| DentalSaaS | https://dental.delriotech.com.ar/ | **Consultorio AR$59.000 · Clínica AR$149.000 · Pro AR$349.000/mes**; auto-agendamiento del paciente desde plan Clínica; WhatsApp automático 24h/2h (requiere configuración adicional); obras sociales + nomenclador; periodontograma |
| Odonto.ar | https://odonto.ar/ | **Individual US$29 (1 usuario) · Profesional US$49 (5) · Clínica US$99 (10)/mes**; 30 días gratis; turnos online **con reglas** (anticipación mínima, "motivos y duración", tope de turnos por paciente, cancelar/reprogramar); obras sociales |
| Livio | https://www.liviodental.com/ | **Plan único AR$99.000/mes** + 30 días gratis; Enterprise a medida; chatbot WhatsApp IA; odontograma + firma; HCE alineada a Ley 27.706; "−40% ausentismo" (**afirmación comercial**) |
| DentalCore | https://dentalcore.app/ | **USD 50/mes (2 usuarios) + USD 10 por usuario adicional**; sin plan gratis (14 días de reembolso); facturación ARCA; cobros MercadoPago; WhatsApp oficial (API Meta); obras sociales; HL7 FHIR |
| DoctorYa | https://doctorya.com.ar/ | **Argenti AR$9.000 (1 agenda) · Aurum AR$25.000 (5 agendas) · (3er plan AR$90.000, rótulo "Argenti" repetido en el sitio)**; recordatorios WhatsApp CONFIRMAR/CANCELAR; odontograma en ficha; facturación ARCA; obras sociales/copagos |
| Dentiqa | https://dentiqa.app/ | **Starter USD 89 · Professional USD 149 · Enterprise USD 249/mes**; agenda multi-dentista con bloqueos por profesional; odontograma + periodontograma; chatbot IA por WhatsApp (Claude) |
| Dentalink | https://www.softwaredentalink.com/ | Planes Esencial / Pro / Titanium; **precio no público (cotización)**; agendamiento online; historia clínica; odontograma + periodontograma; firma; ISO 27001 / HIPAA / GDPR; +15.000 clínicas |
| Mi Agenda Dental | https://miagendadental.com/ | **Inicio $99 · Estándar $199 · Plus $399 · Premium $699 · Clínica desde $349 · Empresarial $2.500 (MXN/mes)**; agenda **por clínica y por unidad (sillón)** con "candados anti-doble-cita"; odontograma NOM-013; WhatsApp |
| Agenda Clínica | https://www.agendaclinicas.cl/ | **Plan Profesional Salud CLP $14.990 · Plan Odontológico CLP $19.990/mes** (+CLP 4.990 por usuario adicional); WhatsApp + correo ilimitados; odontograma (plan Dental); MercadoPago |
| Simples Dental | https://www.simplesdental.com/ | Agenda online + confirmaciones WhatsApp; prontuario con odontograma; firma electrónica; "Secretária IA"; **precio no en la home (link a /planos-e-precos)**; trial 7 días |
| Clinicorp | https://clinicorp.com/ | **Standard R$149,90/mes · Premium R$369,90/mes** (en FAQ); confirmaciones WhatsApp; prontuário; self-check-in QR; +32 mil clínicas |
| Dentally | https://www.dentally.com/en-gb/pricing | **Starter £125–265 · Essentials £220–380 · Pro £320–510/mes** (1/2/3 surgeries, +VAT); Dentally Portal (online booking, digital forms, kiosk); NHS |
| Curve Dental | https://www.curvedental.com/ | Patient self-scheduling; Curve GRO (recordatorios); Curve Pay; charting + perio; imaging; **precio por cotización (no público)** |
| Open Dental | https://www.opendental.com/ | Graphical tooth chart; eServices (Patient Portal, Web Sched, Integrated Texting, Automated Messaging); **precio no en la home (página Order)** |
| Cliniko | https://www.cliniko.com/pricing | **US$45 (1) · 95 (2–5) · 145 (6–8) · 195 (9–12) · 295 (13–25) · 395 (26–200)/mes**; SMS 10¢/msg; **sin odontograma**; multi-location |

## 3) Sistemas NO evidenciados (URL oficial NO abierta en esta sesión)

Estos aparecieron en resultados de búsqueda pero **no abrí su sitio oficial**: se listan como
**No evidenciado** y **quedan fuera** de la tabla comparativa y del scoring del informe.

Dentrix · Dentrix Ascend · EagleSoft · tab32 · Doctolib · DenPro (AR/CO) · SmileSys · OralDrive ·
EIR DR. · Dentidesk · Dentalware · Bilog · ClinIA/OdontoClinIA · AxisMed · DentalFLOW · Turnito ·
ReservaSimple · iTurnos · Dentatools · Orthoeasystem · Dentiqa (datos previos de comparador, ahora reemplazados por la
página oficial) · "Dentiqa vs Dentalink ~USD 150" (comparador, descartado).

## 4) Calidad del dato

- [x] 16 sistemas con **URL oficial abierta** y datos leídos en la página
- [x] Precios verificados en la propia página (o marcados "no público"/"no evidenciado")
- [x] "No evidenciado" usado donde no hay prueba en la página
- [x] Afirmaciones comerciales separadas de features comprobadas (ver D.4 del informe)

## 5) Pendientes para validar en demo (no bloqueantes)

- [ ] Confirmar doble ocupación de **sillón/box** real (DentalSaaS, DentalCore, DentalSoft)
- [ ] Verificar ventana de cancelación configurable y duración por prestación end-to-end
- [ ] Comprobar facturación **ARCA + obras sociales** en producción (DentalCore, DoctorYa)
- [ ] Probar **auto-agendado sin login** (nombre + teléfono): ninguno lo declara explícitamente
- [ ] Pedir precio en ARS a los que cotizan (DentalSoft>10 prof., Livio, Dentiqa, Dentalink)
