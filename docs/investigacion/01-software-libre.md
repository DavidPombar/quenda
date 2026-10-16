# Anexo 01 · Soluciones de software libre para reserva de recursos e instalaciones

> Investigación web del 2026-10-16. Datos de licencia y actividad tomados de la API de GitHub
> ese día salvo indicación. Donde no se pudo verificar se indica **desconocido**.
> Leyenda: MT = multi-tenant (varios concellos en una instancia); A11y = accesibilidad;
> i18n = idiomas (gl = gallego, es = español).

## 1. Candidatos genéricos de reserva de recursos

### 1.1 LibreBooking (fork comunitario de Booked Scheduler)
- Repo: https://github.com/LibreBooking/librebooking · docs: https://librebooking.readthedocs.io
- Licencia: **GPL-3.0** (Booked pasó a SaaS cerrado el 1-11-2020; última versión libre 2.8.5; LibreBooking nace 11-11-2020).
- Stack: PHP ≥ 8.2, MySQL 8 / MariaDB 10.6, Apache, Bootstrap 5, Composer, Docker oficial.
- Actividad: muy activa; v7.1.0 publicada 13-10-2026; 827 ★. Atención: v7.0.0 y v7.1.0 corrigen dos fallos críticos (toma de cuenta admin; cookie «Remember Me» falsificable).
- Funcionalidad: recursos agrupados en «schedules» con reglas por recurso (duración mín/máx, antelación, aprobación, cuotas, créditos/pago, lista de espera, recurrencias), roles, informes de uso, exportación ICS, temas, plugins.
- MT: **no nativo**. Lo más cercano: un «schedule» + grupo de administradores por concello, o una instancia por concello.
- API/estándares: API REST JSON heredada de Booked; ICS; autenticación LDAP/AD, SAML, OAuth2 (OIDC no documentado).
- A11y: no documentada. i18n: ~40 idiomas incl. es, ca, eu, pt_pt; **sin gallego**.
- Encaje deportivo: parcial-alto. Carencias: MT, OIDC, pago online (solo «créditos»), KPIs, A11y, código PHP legacy (Smarty).
- Veredicto: **base viable** (la más completa funcionalmente) si se acepta PHP legacy y se construye la capa multi-concello.

### 1.2 ep3-bs (ep-3 Bookingsystem)
- Repo: https://github.com/tkrebs/ep3-bs · Licencia: **MIT**.
- Stack: PHP 8.1–8.4, MySQL, **Zend Framework 2.5** (obsoleto).
- Actividad: v1.9.1b 15-08-2026; 215 ★; un único mantenedor.
- Funcionalidad: **específico de pistas** (nació para un club de tenis). Calendario por «squares» (pistas) y franjas, límite de reservas activas concurrentes, rango mínimo, facturación/estados de cobro, reglas de precios, responsive.
- MT: no. API: no. Auth propia. A11y: no documentada. i18n: solo en/de.
- Veredicto: **referencia funcional muy útil** (modelo de datos y reglas de pistas); como base, arriesgado.

### 1.3 MRBS (Meeting Room Booking System)
- Web: https://mrbs.sourceforge.io · código: https://github.com/meeting-room-booking-system/mrbs-code
- Licencia: **GPL-2.0**. Stack: PHP ≥ 7.2, MySQL/PostgreSQL, Dockerfile.
- Actividad: activa; v1.12.2 (26-05-2026); ~9.800 commits.
- Funcionalidad: áreas → salas/recursos, reservas por hora o por «periodos» (franjas fijas), repeticiones, aprobación, anti-conflictos, informes. Autenticación muy amplia (BD, LDAP, SAML vía simpleSAMLphp, CAS…).
- MT: no. API REST: no (export iCal sí). A11y: no documentada.
- i18n: 33 idiomas incl. es, ca, eu, pt y **gl** — único candidato con gallego.
- Veredicto: referencia / base solo para núcleo de disponibilidad; no como plataforma ciudadana.

### 1.4 GRR (Gestion et Réservation de Ressources)
- Repo: https://github.com/JeromeDevome/GRR · Licencia **GPL-2.0** · PHP 8.1–8.5, **Symfony 6**, MySQL.
- Actividad: v4.6.7 (13-09-2026); muy usado en educación y colectividades francesas.
- Dominios/áreas, recursos, periodos, recurrencias, moderación, cuotas; LDAP/CAS/SSO. MT: no. i18n: fr, en, es, it, de.
- Veredicto: referencia; posible base si se prefiere Symfony, pero orientado a intranet.

### 1.5 Easy!Appointments
- Repo: https://github.com/alextselegidis/easyappointments · **GPL-3.0** · PHP ≥ 8.2, CodeIgniter 3.
- v1.6.0 (27-05-2026); 4.438 ★. API REST v1 documentada, Google Calendar, email/SMS, webhooks, LDAP, CalDAV.
- Modelo «persona que atiende», no «recurso». MT: no. i18n: 40+ incl. es, ca, pt; sin gl.
- Veredicto: referencia (API y UX); base poco natural.

### 1.6 Seatsurfing
- Repo: https://github.com/seatsurfing/seatsurfing · **GPL-3.0** (plugin «Plus» de pago) · Go + React/Next.js PWA, PostgreSQL.
- v1.136.1 (14-10-2026). Reserva de escritorios/salas sobre planos. OIDC genérico y multi-organización: desconocido.
- Veredicto: referencia de arquitectura moderna (Go + REST + PWA); no base.

### 1.7 Indico (CERN)
- https://github.com/indico/indico · **MIT** · Python/Flask, React. Módulo Room Booking sólido; auth LDAP/SAML/OIDC. MT: no.
- Veredicto: referencia (motor de salas) pero monolito centrado en eventos.

### 1.8 Odoo Community + OCA `resource_booking`
- Repo: https://github.com/OCA/calendar (ramas 16.0–19.0). Licencia **AGPL-3.0**. **El módulo oficial `appointment` es Enterprise (OEEL-1)** → descartar.
- Tipos de reserva con disponibilidad, combinaciones de recursos, portal, URL tokenizada, conflictos, plazos de modificación. Mantenedores Tecnativa.
- MT: multi-company de Odoo. API: XML-RPC/JSON-RPC + OCA `base_rest`; OIDC vía OCA `auth_oidc`. i18n: es completo, gl parcial. A11y: no certificada.
- Veredicto: **base viable** si el equipo domina Odoo; infraestructura pesada para concellos pequeños.

### 1.9 Cal.com → Cal.diy
- https://github.com/calcom/cal.com (renombrado **cal.diy**, mayo 2026). Licencia ahora **MIT**, pero el código `ee/` (Organizations, SSO/SAML, pagos) fue **eliminado**. README recomienda «uso personal, no producción».
- Modelo de citas con personas. Veredicto: solo referencia de UX.

### 1.10 Rallly — AGPL-3.0. Votación de fechas (tipo Doodle). Encaje: **no**.

### 1.11 Pretix
- https://github.com/pretix/pretix · **AGPL-3.0 con términos adicionales** (atribución «powered by pretix» obligatoria). Python/Django; multi-organizador nativo, API REST completa, pagos, cuotas, franjas horarias.
- Encaje: **parcial**: excelente para **aforo/entradas de piscina por franja** y cobro; mal para reserva exclusiva de pista.

### 1.12 Alf.io — GPL-3.0, Java. Ticketing de eventos. Encaje: no.

### 1.13 Descartados por licencia o modelo
Skedda y Coworks (propietarios), Amelia Pro (propietario), módulo Booking de Dolibarr (Dolistore, licencia desconocida/comercial), reserva de recursos en ERPNext (app de pago de Webkul).

### 1.14 WordPress / Drupal
- Bookly Lite y Simply Schedule Appointments: modelo «personal», limitados; solo referencia.
- **Drupal BEE** (Bookable Entities Everywhere, sobre BAT): **GPL-2.0-or-later**; 11.0.0 estable (11-2024), 11.1.0-rc3 (12-2025); disponibilidad diaria u horaria, múltiples unidades, pago con Drupal Commerce; «busca co-mantenedores». Drupal aporta multisite, es/gl, A11y de core. Base viable solo si el equipo es Drupal.

### 1.15 No encontrados o solo UI
- Qalendar (Vue 3, MIT, sin mantenimiento; sucesor Schedule-X, MIT): solo UI de calendario.
- Timetable, OpenCampus, Hamsa/Hamster, OpenResa, OpenPlanning, e-reservas: **no encontrados** como software libre identificable.

## 2. Proyectos específicos de deporte en GitHub
Fuera de ep3-bs no hay ningún proyecto deportivo con comunidad; todo son TFG/TFM o prototipos (<10 ★): adroste/tennis-court-reservation-system-v2 (AGPL-3.0, abandonado 2021), dandreavh/Proyecto-Servidor-AppReservasPistas (GPL-3.0, 2023), guilletDev/PadelUP (AGPL-3.0, 2025), y varios sin licencia declarada (no reutilizables). Búsquedas en italiano y alemán: solo repos de 0 ★ sin licencia.

## 3. Sector público
- **Kommunale Räume (openCode.de, Alemania)** — https://gitlab.opencode.de/DEUTSCHLAND.DIGITAL/l1/kommunale-raeume-app — **Apache-2.0**, v4.2.0 (01-04-2026). Plataforma **nacional multi-municipio** para publicar, reservar por día u hora y pagar espacios municipales (proyecto Smarte.Land.Regionen). App ciudadana + app admin + backend; identidad delegada en la plataforma «DeDi». Stack/i18n: **desconocido**. **Precedente más parecido al enunciado del concurso.**
- **OpenCity Italia – Stanza del Cittadino** — https://gitlab.com/opencity-labs/area-personale/core — AGPL-3.0-or-later, microservicios multi-tenant, OpenAPI, Bootstrap Italia, SPID/CIE; módulo de citas (no instalaciones). Referencia de arquitectura multi-ente y accesibilidad.
- **OPEN-ENT-NG RBS** (Francia) — AGPL-3.0, acoplado a Ent-core; 2023. Referencia.
- Developers Italia: API caída (500) → desconocido. code.gouv.fr / La Suite: sin herramienta de reservas. CTT / forja-CTT y mancomún: **ninguna solución de reservas deportivas publicada**. Consul y Decidim: sin módulo de reservas; referencia de multi-tenant (Decidim) y A11y.

## 4. Shortlist ordenada (como BASE)
1. **LibreBooking (GPL-3.0)** — mayor cobertura funcional de serie; trabajo: multi-concello, OIDC, pago/tasas, KPIs, WCAG, gl, y asumir PHP legacy con CVE recientes.
2. **Odoo Community + OCA resource_booking (AGPL-3.0)** — back-office y pagos; trabajo: portal ciudadano a medida, A11y, simplificar despliegue.
3. **Drupal 10/11 + BEE/BAT (GPL-2.0+)** — A11y, i18n, multisite; trabajo: reglas deportivas, notificaciones, KPIs; BEE con mantenimiento débil.
4. **Kommunale Räume (Apache-2.0)** — único precedente público multi-municipio; clonar y auditar antes de decidir.
5. **ep3-bs (MIT)** — mejor «cantera» de requisitos de pistas; base técnica débil.

Menciones: MRBS (gallego; motor de periodos), GRR (Symfony), Pretix (aforo/entradas), Easy!Appointments (API), OpenCity/Decidim (patrones públicos).

**Conclusión:** no existe ninguna solución libre que cumpla el pliego completo. Estrategia realista: núcleo de disponibilidad/reglas inspirado en LibreBooking/ep3-bs/MRBS, arquitectura multi-tenant e identidad (OIDC/Cl@ve) propias, y portal ciudadano nuevo con WCAG 2.1 AA e i18n gl/es desde el inicio.

Pendiente de verificar: idiomas y OIDC de Seatsurfing, stack de Kommunale Räume, catálogo de Developers Italia, lista exacta de métodos de autenticación de MRBS/GRR.
