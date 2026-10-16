# Anexo 04 · Bloques técnicos open source para la plataforma

> Investigación web del 2026-10-16. **Verificado** = fuente consultada; **(no verificado)** o
> **desconocido** = comprobar en el repositorio/LICENSE antes de citarlo en la memoria.

## 0. Resumen
- No existe un sistema de diseño español (AGE) con librería de componentes publicada. Los reutilizables con licencia OSI: **GOV.UK Frontend (MIT)**, **Bootstrap Italia (CC0 + MIT; confirmar)**, **KERN/KoliBri (EUPL-1.2)**, **USWDS (CC0)**. DSFR francés es MIT pero de uso reservado al Estado francés. La Xunta publica identidad corporativa (Decreto 112/2021, tipografía Xunta Sans) pero no componentes.
- Varios BaaS **no son OSI**: Directus (BSL 1.1 → licencia propia con umbral 5 M$). Supabase, PocketBase, Appwrite, Strapi CE, Appsmith, NocoDB son OSI. Zitadel pasó a AGPL-3.0 (sigue OSI).
- Identidad: **Keycloak (Apache-2.0)**, con más casos en AAPP españolas y broker SAML para Cl@ve.
- Pagos: librerías Redsys OSI en PHP, Node y Python.

## 1. Frameworks full-stack

| Opción | Licencia | Multi-tenant | A11y / i18n (gl) | Recomendación |
|---|---|---|---|---|
| **Django 5.2 LTS** (+ django-tenants, Wagtail) | BSD-3-Clause; django-tenants MIT | **django-tenants 3.14.0** (schemas PostgreSQL) verificado | Galego **`gl` incluido en Django desde 2008** (verificado); admin accesible; Wagtail con programa de accesibilidad | **Mejor equilibrio para sector público** |
| Ruby on Rails 7/8 | MIT | `acts_as_tenant` / `ros-apartment` | `rails-i18n` incluye gl (verificado) | Precedente fuerte: CONSUL y Decidim son Rails |
| Laravel 11/12 (+ stancl/tenancy) | MIT | single/multi-DB | gl en Laravel-Lang **no verificado**; Filament como admin | Pragmático; talento PHP abundante en Galicia |
| NestJS + Next.js | MIT | a mano (subdominio + `tenant_id`/RLS) | next-intl/i18next; a11y según UI (react-aria) | Ideal con Supabase (stack A) |
| Phoenix, Spring Boot, .NET | MIT / Apache-2.0 / MIT | sí | sí | Válidos pero no recomendados por talento o peso |

## 2. BaaS / low-code

| Herramienta | Licencia | ¿OSI? | Notas |
|---|---|---|---|
| **Supabase** | Apache-2.0 (Studio/Docker), GoTrue MIT, PostgREST MIT — verificado | Sí | Multi-tenant vía **RLS** con `council_id`; self-host ≈10 contenedores, mejor alojado en deputación |
| **PocketBase** | MIT (verificado) | Sí | Un binario + SQLite; ideal «una instancia por concello», no varios en una |
| Appwrite | BSD-3-Clause (no verificado) | Sí | Alternativa a Supabase |
| Strapi v5 CE | MIT; `ee/` propietario | Sí (CE) | Más CMS que backend de reservas |
| **Directus** | **BSL 1.1 / MSCL, no OSI** (verificado) | **No** | **Descartar** |
| NocoDB | AGPL-3.0 | Sí | Back-office tabular |
| Budibase | GPL-3.0 con «pro» no incluido y dependencia no libre (verificado) | Parcial | Descartar como núcleo |
| Appsmith | Apache-2.0 (verificado) | Sí | Paneles internos |

## 3. Sistemas de diseño y componentes accesibles

| Sistema | Licencia | Notas |
|---|---|---|
| **GOV.UK Frontend** | MIT (verificado) | WCAG 2.2 AA auditado; ports React/Rails; sin date-picker (usa «date input» de 3 campos) |
| **Bootstrap Italia / Design System Italia** | CC0 + MIT según README; otras fuentes BSD-3 — **confirmar** | Más completo para apps transaccionales; date/time picker; kits React/Vue; temas regionales (bootstrap-lombardia) |
| DSFR (Francia) | MIT, **uso reservado al Estado francés** | Solo inspiración |
| **KERN UX-Standard** (DE) | **EUPL-1.2** (verificado) sobre KoliBri (Web Components) | Multi-theming nativo = un tema por concello; docs en alemán |
| USWDS | CC0-1.0 | Estética muy «US» |
| Sistema AGE (España) | **No localizado** | Indicar en la memoria que no existe kit publicado |
| Xunta de Galicia | Manual de identidade (Decreto 112/2021), Xunta Sans — verificado | Usar tokens sobre GOV.UK/Bootstrap Italia |

Componentes de calendario:
- **React Aria Components** (Apache-2.0): DatePicker/Calendar con i18n gl-ES, referencia en a11y.
- **Schedule-X** (`@schedule-x/calendar` MIT, verificado): vistas día/semana/mes.
- **FullCalendar**: núcleo MIT; **Premium (resource timeline, ideal para «pistas × horas») gratuito para proyectos GPLv3-compliant** (verificado en fullcalendar.io/license) — confirmar por escrito.
- Duet Date Picker (MIT, poco activo), Toast UI Calendar (MIT).
- Recomendación: grid de disponibilidad propio (tabla accesible pista × franja con `aria-pressed`) + React Aria para fechas.

## 4. Identidad

| IdP | Licencia | Multi-tenant | Notas |
|---|---|---|---|
| **Keycloak 26** | Apache-2.0 | **Organizations** (desde v26) o un realm por concello | Passkeys por defecto desde 26.3/26.4 (verificado); broker SAML 2.0 maduro; el patrón en AAPP es Keycloak como SP frente a Cl@ve e IdP OIDC para las apps. **Recomendado** |
| Authentik | MIT salvo `enterprise/` (verificado) | Brands | Más ligero |
| Zitadel | **AGPL-3.0 desde v3** (verificado) | Nativo | Sigue OSI |
| ORY | Apache-2.0 | Por configuración | Mayor esfuerzo |

**Cl@ve**: federación SAML 2.0 perfil eIDAS; kit de integración Cl@ve 2.0 (motor SAML + SP-DEMO Java) y entorno de pruebas; alta vía Registro-Cl@ve con certificado. Andalucía usa un ProxyCl@ve — el papel que Keycloak haría para una deputación. **Chave365**: sin documentación pública de integración para terceros; consultar a AMTEGA. Para reservas basta nivel bajo/sustancial; prever registro local con email + passkeys.

## 5. Notificaciones
- Email: SMTP del concello/deputación; **Postal** (MIT) si hace falta servidor; **Mailpit** (MIT) para desarrollo; **Listmonk** (AGPL-3.0) para boletines.
- SMS: sin proveedor libre; interfaz abstracta sobre pasarelas nacionales. WhatsApp: solo API oficial propietaria; evitar.
- Web Push (VAPID): `web-push` (npm, MPL-2.0), `pywebpush` (MPL-2.0), `web-push-php` (MIT); PWA iOS ≥16.4.
- Patrón: cola (Celery/Sidekiq/BullMQ) + plantillas gl/es + preferencias por usuario.

## 6. Pagos (Redsys)

| Lenguaje | Librería | Licencia |
|---|---|---|
| PHP | **creagia/redsys-php** (+ laravel-redsys), omnipay-redsys, payum-redsys, redsys/tpv | MIT |
| Node | **node-redsys-api** (verificado) | MIT |
| Python | **python-redsys** (1.2.0, 2023), django-payments-redsys | BSD/MIT (no verificado) |
| Ruby | redsys-rails / sermepa | MIT, poco activas |

Flujo de **redirección** (formulario firmado HMAC-SHA256 + notificación servidor) evita PCI-DSS. Redsys exige TPV contratado con el banco del concello.

## 7. Dominio de reservas, iCalendar, analítica
- iCalendar: `ical-generator` (MIT), `icalendar` Python (BSD-2), `ics` npm (ISC), `spatie/icalendar-generator` (MIT). Feed ICS por usuario con token + webcal.
- Recurrencia: `rrule` (BSD-3), `python-dateutil.rrule`, `ice_cube` (MIT), `simshaun/recurr` (MIT). UTC en BD, `Europe/Madrid` en pantalla.
- **Modelo sugerido**: `Council` → `Facility` → `Resource` → `AvailabilityRule` (RRULE + excepciones) → `Booking` con `EXCLUDE USING gist (resource_id WITH =, tstzrange WITH &&)` para evitar solapes.
- Analítica: **Metabase OSS** (AGPL-3.0) o Grafana (AGPL-3.0) sobre vistas SQL; **Umami** (MIT) o Plausible CE (AGPL-3.0) sin cookies. «Recomendación de franjas» = SQL de ocupación histórica + heurística; sin ML.

## 8. Despliegue

| Opción | Licencia | Encaje |
|---|---|---|
| **Docker Compose** (+ Traefik/Caddy) | Apache-2.0 | Base; backups `pg_dump` + restic/Borg a S3/MinIO |
| **Coolify** | Apache-2.0 (verificado) | Mejor UX para técnicos municipales no DevOps |
| Dokploy | Apache-2.0 desde ene-2026 con carpetas source-available (verificado) | Vigilar licencia |
| CapRover | Apache-2.0 | Swarm en mantenimiento |
| k3s + Helm | Apache-2.0 | Solo deputación |
| YunoHost | AGPL-3.0 | Paquete autoinstalable |

**ENS**: datos personales corrientes → categoría MEDIA habitual (o BÁSICA según análisis). Proveedores con ENS verificados: Arsys (medio), ACENS (medio), Digital Realty (alto). Recomendar despliegue en CPD/cloud certificado de la deputación, cifrado en reposo, logs, MFA de administradores.

## 9. Móvil
PWA (estándares W3C) primero: más barata y abierta, instalable, QR y calendario offline. **Capacitor** (MIT) como extra para tiendas y NFC. Flutter/React Native: segundo código base, no justificable en 6 semanas.

## 10. Acceso por QR
- Generación: `qrcode` (npm, MIT), `segno`/`python-qrcode` (BSD-3), `bacon/bacon-qr-code` (BSD-2). Lectura: `html5-qrcode`, `@zxing/browser` (Apache-2.0), `BarcodeDetector` nativo.
- **Validación offline**: QR = token firmado (**JWT ES256** o PASETO) con `booking_id`, `resource_id`, `nbf/exp`, `tenant`; el lector valida con la clave pública sin red; lista de revocación corta. Librerías: `jose`, `PyJWT`, `firebase/php-jwt`.
- Hardware: evitar **Wiegand** (texto claro, replay demostrado en Black Hat 2015); preferir **OSDP v2** con Secure Channel; **libosdp** (Apache-2.0, verificado). Prototipo: «modo conserje» con escáner en el móvil del personal.

## 11. Dos stacks de referencia

### Stack A — «más rápido de prototipar»
Supabase self-host (Apache-2.0) · Next.js 15 + React · React Aria Components · Schedule-X / FullCalendar MIT · tokens govuk-frontend o Bootstrap Italia con identidad Xunta · Umami · Docker Compose + Coolify · PWA · node-redsys-api · ical-generator · Keycloak opcional para Cl@ve.
- Multi-tenant: `council_id` + RLS, subdominio por concello, tabla `council_settings`.
- Punto débil: Supabase self-host pesado para un concello solo; i18n/a11y dependen de disciplina del equipo.

### Stack B — «más defendible para adopción pública» (recomendado para la memoria)
Django 5.2 LTS + django-tenants 3.14 + PostgreSQL · plantillas server-side con govuk-frontend o Bootstrap Italia + HTMX (BSD-2) · React Aria en islas · Keycloak 26 (Organizations + broker SAML Cl@ve + passkeys) · Celery/Redis o django-q · python-redsys · icalendar · Metabase OSS + Umami · Docker Compose «un comando» + Coolify; k3s opcional para deputación · PWA + pywebpush · licencia AGPL-3.0 o EUPL-1.2.
- Admin de Django da back-office completo el día 1; schema por concello facilita exportación/borrado RGPD por entidad; gl/es nativo; formularios accesibles renderizados en servidor.
- Apps Django desacopladas (`facilities`, `bookings`, `payments`, `access`), API OpenAPI (DRF o Django Ninja) para la app móvil y terceros.

**Criterio**: si el equipo domina React/TypeScript y quiere tiempo real en la demo → A; si se prima sostenibilidad, accesibilidad «por construcción», gallego nativo y mantenibilidad por una pyme gallega → B. Híbrido razonable: B con frontend Next.js opcional más adelante.

## Incógnitas
1. Sistema de diseño AGE con componentes (no localizado).
2. Licencia exacta de Bootstrap Italia y de Appwrite.
3. Federación Chave365 para concellos (AMTEGA) y alta en Cl@ve para EELL.
4. Locale `gl` en Laravel-Lang.
5. Hosting ENS, pasarela de pago y SMS corporativos de la deputación.

## Fuentes principales
Zitadel AGPL: https://zitadel.com/blog/apache-to-agpl · Directus: https://directus.io/docs/self-hosting/overview · Supabase: https://supabase.com/docs/guides/getting-started/architecture.md · Strapi LICENSE: https://fossies.org/linux/strapi/LICENSE · Authentik: https://fossies.org/linux/authentik-version/LICENSE · Budibase: https://isitreallyfoss.com/projects/budibase · Keycloak 26: https://www.keycloak.org/2024/06/announcement-keycloak-organizations · https://www.keycloak.org/docs/26.4.1/release_notes · Cl@ve kit: https://inza.blog/2018/07/21/nuevo-kit-de-integracion-del-sistema-de-gestion-de-identidad-digital-del-estado-clve-2-0/ · ProxyCl@ve: https://desarrollo.juntadeandalucia.es/recursos/activo/proxy-clave · Xunta Cl@ve/Chave365: https://www.xunta.gal/notas-de-prensa/-/nova/82878/xunta-amplia-identificacion-electronica-sistema-clave-aberto-cidadania · Identidade Xunta: https://www.xunta.gal/gl/identidade-corporativa · KERN: https://interoperable-europe.ec.europa.eu/eu-oss-catalogue/solutions/kern-ux-standard · Bootstrap Italia: https://cdn.jsdelivr.net/npm/bootstrap-italia@2.18.3/README.EN.md · DSFR: https://www.info.gouv.fr/organisation/service-d-information-du-gouvernement-sig/systeme-de-design · Schedule-X: https://github.com/argshook/schedule-x · FullCalendar: https://fullcalendar.io/license · Redsys libs: https://github.com/creagia/redsys-php · https://pypi.org/project/python-redsys · django-tenants: https://newreleases.io/project/pypi/django-tenants/release/3.14.0 · Django gl: https://code.djangoproject.com/attachment/ticket/4408/django.po · Coolify/Dokploy: https://isitreallyfoss.com/projects/dokploy/ · ENS proveedores: https://www.arsys.es/blog/certificacion-seguridad-ens · Metabase: https://metabase.com/license · Umami: https://isitreallyfoss.com/projects/umami · OSDP: https://github.com/gotomain/libosdp · Wiegand: https://www.blackhat.com/docs/us-15/materials/us-15-Evenchick-Breaking-Access-Controls-With-BLEKey-wp.pdf
