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
- Swagger: http://127.0.0.1:3001/api/docs
- OpenAPI: http://127.0.0.1:3001/api/openapi.json

The database persists in the `quenda_quenda-data` Docker volume. Setup is repeatable and does not overwrite existing facilities or reservations. Ports: website 5173, citizen development server 5174, admin development server 5175, API 3001, PostgreSQL 55432. The website development server proxies `/app/` and `/admin/` to their respective frontends and `/v2/` to the API, keeping navigation and session cookies on one origin. `Ctrl+C` stops development servers; `docker compose stop` stops the database while preserving data.

The three frontends are independent npm workspaces: `frontend/web` is the public presentation website; `frontend/app` owns the citizen catalog and reservations; `frontend/admin` owns municipal facility management, calendars and indicators. Each has its own router, styles, build and browser tests. They communicate through ordinary links and share no source imports. Build each with `npm run build -w frontend/web`, `npm run build -w frontend/app` or `npm run build -w frontend/admin`. All select fields use Chakra `NativeSelect`. The shared visual language (Atkinson Hyperlegible Next, Phosphor icons via `react-icons`, a Chakra theme per workspace, breakpoints and responsive rules) is described in the [design guidelines](docs/architecture/design-guidelines.md).

The **Entrar** button opens a synthetic citizen account in `/app/` and a synthetic municipal-manager account in `/admin/`. The citizen app has no manager menus or login choice, and the backoffice requires a manager session. Use the municipality selector to explore **Portomar** and **Vilaverde**, which have independent accounts and reservations. Switching municipality signs out the previous session. The demo has one same-origin session: signing into a different audience replaces the active role; each frontend only accepts its own role. Nothing in this demonstration makes a real sports reservation or charges money.

`npm run dev` explicitly enables demo login. The API otherwise rejects demo login unless `DEMO_MODE=true`. Environment settings are listed in `.env.example`; the API reads process environment variables. No email, password or third-party account is required.

## Container demonstration

```sh
docker compose -f compose.yml -f compose.demo.yml up --build --wait
```

Open http://127.0.0.1:8080 for the website, http://127.0.0.1:8080/app/ for citizens or http://127.0.0.1:8080/admin/ for municipal management. This starts all three independent frontend builds, API, migrations and synthetic seed data. Nginx serves the website at `/`, the citizen app at `/app/` and the backoffice at `/admin/`, including reloads of nested routes. All host ports bind to loopback. The demo Compose file intentionally enables demo accounts; it is not a production deployment configuration. The base images and services are self-hostable and do not require a proprietary cloud.

## Included

- **C1:** public facility catalog, search and sport filters, details, rules, accessible-access information and real availability.
- **C2:** online reservation with server-side validation, client UUID retries, atomic overlap protection and per-person quotas.
- **C3:** rescheduling and idempotent cancellation within the municipality's notice period.
- **C4:** personal upcoming/history views and persistent in-app confirmation/change/cancellation notices.
- **M1–M2:** manager-only facility creation/editing, active/maintenance/closed states, slot duration, indicative prices, rules, `.ics` import and a weekly calendar editor.
- **M3:** seven-day reservation, cancellation and scheduled-occupancy indicators, broken down by facility.
- **Personal calendars (optional, point 1.3):** each confirmed reservation downloads as `.ics`, and a revocable `webcal://` subscription keeps the person's calendar app in sync with changes and cancellations.
- **R1–R3:** repeatable setup and container images; data-driven municipal identity, language, time zone, booking limits and legal/contact text; protected operations derive their municipality from the session.

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

This is a functional prototype with synthetic accounts, not a service ready to process residents' personal data. Production onboarding/OIDC (Cl@ve/Chave365), real identities, account export/deletion and retention policies, email/SMS/reminder delivery, rate limiting, operational backups, hardening and an independent accessibility/security review remain future work. No GDPR/ENS compliance or WCAG certification is claimed.

Facilities are closed or put into maintenance rather than deleted; historical bookings remain intact. Photos, multiple independently reservable courts per facility, residency-dependent rules, payments and QR entry are outside this V0. Municipal settings are bootstrap/database configuration; the manager UI currently edits facilities and their rules. A schedule/state change with future reservations is rejected to avoid silently invalidating bookings. The API returns at most 200 history entries and 50 notices; the citizen app shows them ten at a time. Production needs server-side pagination and retention.

See [architecture](docs/architecture/implementation.md), [database migrations](docs/architecture/migrations.md), [design guidelines](docs/architecture/design-guidelines.md), [calendar semantics](docs/architecture/calendars.md), and the original [scope](docs/contexto/01-alcance-funcional.md).
