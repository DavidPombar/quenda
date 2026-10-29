# Quenda

A working V0 of a municipal sports reservation service for the GOBTEC proposal. React 19 + Chakra UI 3 + Vite, NestJS 12 and PostgreSQL 17. Galician by default, Spanish available. AGPL-3.0-or-later.

## Run locally

Requires Node 24, npm and Docker with Compose.

```sh
npm ci
npm run setup
npm run dev
```

- Public website: http://127.0.0.1:5173
- Citizen application: http://127.0.0.1:5173/app/
- Municipal backoffice: http://127.0.0.1:5173/admin/
- Email sent by the demo (Mailpit): http://127.0.0.1:8025
- Door mode (QR access): http://127.0.0.1:5173/admin/ → **Entrar como control de accesos**; `npm run access:simulator` stands in for a lock controller
- Swagger: http://127.0.0.1:3001/api/docs
- OpenAPI: http://127.0.0.1:3001/api/openapi.json

The database persists in the `quenda_quenda-data` Docker volume. Setup is repeatable and does not overwrite existing facilities or reservations. Ports: website 5173, citizen development server 5174, admin development server 5175, API 3001, PostgreSQL 55432, Mailpit SMTP 1025 and web 8025. `npm run dev` also starts the notice worker, which sends confirmations, changes, cancellations and reminders to Mailpit. The website development server proxies `/app/` and `/admin/` to their respective frontends and `/v2/` to the API, keeping navigation and session cookies on one origin. `Ctrl+C` stops development servers; `docker compose stop` stops the database while preserving data.

The three frontends are independent npm workspaces: `frontend/web` is the public presentation website; `frontend/app` owns the citizen catalog and reservations; `frontend/admin` owns municipal facility management, calendars and indicators. Each has its own router, styles, build and browser tests. They communicate through ordinary links and share no source imports. Build each with `npm run build -w frontend/web`, `npm run build -w frontend/app` or `npm run build -w frontend/admin`. All select fields use Chakra `NativeSelect`. The shared visual language (Atkinson Hyperlegible Next, Phosphor icons via `react-icons`, a Chakra theme per workspace, breakpoints and responsive rules) is described in the [design guidelines](docs/architecture/design-guidelines.md).

The **Entrar** button opens a synthetic citizen account in `/app/` and a synthetic municipal-manager account in `/admin/`. The citizen app has no manager menus or login choice, and the backoffice requires a manager session. Use the municipality selector to explore **Portomar** and **Vilaverde**, which have independent accounts and reservations. Switching municipality signs out the previous session. The demo has one same-origin session: signing into a different audience replaces the active role; each frontend only accepts its own role. Nothing in this demonstration makes a real sports reservation or charges money.

`npm run dev` explicitly enables demo login. The API otherwise rejects demo login unless `DEMO_MODE=true`. Environment settings are listed in `.env.example`; the API reads process environment variables. No password or third-party account is required; demo citizens carry a synthetic `alex@<concello>.example` address whose email lands in Mailpit.

To try public identity locally, run `npm run identity:up` to start Keycloak with a **simulated Cl@ve** at http://127.0.0.1:8081, set the OIDC variables from `.env.example` and restart `npm run dev`: the sign-in dialog then offers **Entrar con Cl@ve**. The backend is a generic OpenID Connect client; Keycloak is a reference provider, not a requirement. See [public identity](docs/architecture/identity.md).

## Container demonstration

```sh
docker compose -f compose.yml -f compose.demo.yml up --build --wait
```

Open http://127.0.0.1:8080 for the website, http://127.0.0.1:8080/app/ for citizens or http://127.0.0.1:8080/admin/ for municipal management. This starts all three independent frontend builds, API, notice worker, migrations and synthetic seed data; email sent by the demo appears in Mailpit at http://127.0.0.1:8025. Nginx serves the website at `/`, the citizen app at `/app/` and the backoffice at `/admin/`, including reloads of nested routes. All host ports bind to loopback. The demo Compose file intentionally enables demo accounts; it is not a production deployment configuration. The base images and services are self-hostable and do not require a proprietary cloud.

## Demo vs production

The container images are the same for both; the difference is configuration and what sits in front of them (T4, R1).

|                | Demo (`compose.demo.yml`)                                  | Production                                                                                |
| -------------- | ---------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Demo accounts  | `DEMO_MODE=true`                                           | `DEMO_MODE=false` (image default); real sign-in is still future work                      |
| Transport      | Plain HTTP on `127.0.0.1:8080`                             | TLS proxy in front, e.g. [Caddy](deploy/Caddyfile) with automatic certificates and HSTS   |
| Session cookie | `COOKIE_SECURE=false`, only because the demo is plain HTTP | `Secure` by default (`NODE_ENV=production` in the image); never set `COOKIE_SECURE=false` |
| Seed data      | Synthetic municipalities and accounts                      | No seed; municipalities are configured explicitly                                         |

The `web` container (nginx) sends a Content Security Policy, `X-Frame-Options`, `Permissions-Policy` and `nosniff` for the three SPAs; the API sends its own headers. Only the TLS proxy may reach the `web` container, because the API trusts `X-Forwarded-For` from private-network proxies (`TRUST_PROXY`, default `loopback, uniquelocal`) to identify clients.

The API limits each client IP to `RATE_LIMIT_PER_MINUTE` requests (default 600) and `SESSION_RATE_LIMIT_PER_MINUTE` sign-ins (default 30) per minute and answers `429` with an RFC 7807 problem and `Retry-After`. Limits are in memory per API process. Expired sessions are deleted at start-up and every `SESSION_PURGE_MINUTES` (default 60; `0` disables it).

`HEADERS_URL=https://reservas.example EXPECT_SECURE_COOKIE=true npm run test:headers` checks a running instance's headers and session cookie.

## Included

- **C1:** public facility catalog, search and sport filters, details, rules, accessible-access information and real availability.
- **C2:** online reservation with server-side validation, client UUID retries, atomic overlap protection and per-person quotas.
- **C3:** rescheduling and idempotent citizen cancellation within the municipality's notice period; municipal cancellations with a reason and notices.
- **C4:** personal upcoming/history views, persistent in-app notices, and transactional email delivery and reminders.
- **M1–M2:** facilities with several courts or lanes, including a full court split into parts that block each other, and courts taken out of service individually; citizens pick a court or view every court in one grid. Managers add, rename, reorder, split and take courts out of service under **Pistas** in the backoffice, and the indicators break each facility down by court. Manager-only facility editing, active/maintenance/closed states, slot duration, indicative prices, rules, `.ics` import, weekly calendars and municipal settings, branding, holidays and legal texts.
- **M3:** seven-day reservation, cancellation and scheduled-occupancy indicators, plus attendance, no-show tracking and configurable booking penalties.
- **Personal calendars (optional, point 1.3):** each confirmed reservation downloads as `.ics`, and a revocable `webcal://` subscription keeps the person's calendar app in sync with changes and cancellations.
- **T3, open data:** each municipality publishes its facility catalogue as schema.org JSON-LD, CSV and GeoJSON with published schemas, plus a DCAT-AP-ES catalogue (RDF/XML and JSON-LD) for datos.gob.es and abertos.xunta.gal. The licence is configurable per municipality (CC BY 4.0 by default), and the files are linked from **Datos abertos** in the citizen app. See [open data](docs/architecture/open-data.md).
- **R1–R3:** repeatable setup and container images; data-driven municipal identity, language, time zone, booking limits and legal/contact text; protected operations derive their municipality from the session.
- **Data portability (criterion 4, T3):** a manager exports all of the municipality's data as one versioned, documented JSON package (`GET /v2/manager/export`, **Exportar datos** in the backoffice); `npm run db:import -- <file> [--slug new-slug]` loads it into another instance. See [data portability](docs/architecture/data-portability.md).

Calendars are stored as RFC 5545 `VCALENDAR` text with `VEVENT`, `RRULE`, `EXDATE`, `RDATE` and individual `RECURRENCE-ID` exceptions. Temporal handles local dates, IANA zones, instants and daylight-saving transitions. See [calendar semantics](docs/architecture/calendars.md).

## Verification

```sh
npx playwright install chromium
npm run check          # architecture, lint, types, unit/browser/HTTP tests, builds
npm run licenses       # free-software license allowlist, including legacy manifests
npm run test:smoke     # requires npm run dev; real browser → API → PostgreSQL + axe
```

HTTP tests create and destroy their own uniquely named database, never the development database. The configured PostgreSQL account needs `CREATEDB`; `TEST_DATABASE_URL` can point to another local test cluster. Browser component tests use network stubs and do not need the API. The smoke flow creates, moves and cancels a synthetic reservation in the demo database and leaves its history for inspection. Screenshots and axe reports are written to `.dev-logs/`.

## V0 boundaries

This is a functional prototype with synthetic accounts, not a service ready to process residents' personal data. Citizens accept the municipality's versioned privacy notice when opening a demo session, can download their data as JSON from **A miña conta** and can delete their account: future reservations are cancelled, sessions are revoked and the account row is anonymised while past reservations stay in the aggregate history. Managers can review the municipality's audit log, with the detail of each change, under **Auditoría** in the backoffice. A retention job (`npm run db:retention`) detaches reservations, notices and audit actors older than each municipality's `retention_months`, purges expired sessions and removes accounts deleted before that cutoff; it has no built-in scheduler and must be run by cron or a systemd timer (see [architecture](docs/architecture/implementation.md)). Production onboarding/OIDC (Cl@ve/Chave365), real identities, SMS and push delivery, distributed rate limiting across API replicas, operational backups and an independent accessibility/security review remain future work. No GDPR/ENS compliance or WCAG certification is claimed.

Open data covers the facility catalogue only: aggregated occupancy, an OpenActive feed and validation against the official DCAT-AP shapes are not included, and the demo coordinates are fictitious. Facilities are closed or put into maintenance rather than deleted; historical bookings remain intact. Photos, shared capacity (several people in one lane), residency-dependent rules, payments and QR entry are outside this V0. The manager UI edits municipal settings and facilities. Schedule changes with future reservations are rejected; facility closures require an explicit reason and cancel affected bookings with notices. The API returns at most 200 history entries and 50 notices; the citizen app shows them ten at a time. Production needs server-side pagination.

See [architecture](docs/architecture/implementation.md), [database migrations](docs/architecture/migrations.md), [open data](docs/architecture/open-data.md), [data portability](docs/architecture/data-portability.md), [data protection lifecycle](docs/architecture/data-protection.md), [design guidelines](docs/architecture/design-guidelines.md), [calendar semantics](docs/architecture/calendars.md), and the original [scope](docs/contexto/01-alcance-funcional.md). Councils adopting Quenda can start from the Spanish templates for the [record of processing activities](docs/legal/registro-actividades-tratamiento.md) and the [processor agreement](docs/legal/contrato-encargado-tratamiento.md); both must be reviewed by the council's data protection officer.

## Contributing and reuse

Quenda is published as a reusable public asset. See [CONTRIBUTING.md](CONTRIBUTING.md), the [security policy](SECURITY.md), the [code of conduct](CODE_OF_CONDUCT.md), the [changelog](CHANGELOG.md) and the [publiccode.yml](publiccode.yml) catalog metadata.
