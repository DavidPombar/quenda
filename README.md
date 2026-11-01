# Quenda

**Online booking of municipal sports facilities for small councils.** Residents find a court or a
pool, see real availability and book, change or cancel in a few taps; the council manages its
facilities, timetables, rules and indicators; a provincial council (*deputación*) can run one
instance for many councils. Free software (AGPL-3.0-or-later), self-hostable, Galician by default
and Spanish available.

Quenda is the proposal for the I Certame GOBTEC de Software Libre (AGASOL, 2026). Its requirements
are traced throughout the code and documentation with the contest's IDs: citizens **C1–C4**,
council **M1–M3**, public reuse **R1–R3** and mandatory technical conditions **T1–T5**
([scope](docs/contexto/01-alcance-funcional.md), [technical requirements](docs/contexto/02-requisitos-tecnicos.md)).

- **Public demo:** https://91-99-68-27.sslip.io/ (synthetic data; **Entrar** opens demo accounts)
- **Stack:** React 19, Chakra UI 3 and Vite · NestJS and Node 24 · PostgreSQL 17 · Docker Compose

## Contents

1. [What it does](#what-it-does)
2. [Try it on your computer](#try-it-on-your-computer)
3. [Install it on a server](#install-it-on-a-server)
4. [How it is built](#how-it-is-built)
5. [Develop and test](#develop-and-test)
6. [Developing with AI agents](#developing-with-ai-agents)
7. [Limits of this version](#limits-of-this-version)
8. [Documentation](#documentation)
9. [Contributing and licence](#contributing-and-licence)

## What it does

### For residents (citizen app, `/app/`)

- **Find a facility (C1):** a catalogue shared by every council of the instance, with search, sport
  filters, step-free access, photos, map, rules, prices by category and the week's opening hours.
- **Book online (C2):** real availability by day and court, including courts split into parts that
  block each other; overlap protection, per-person limits and booking windows are enforced by the
  server. When a day is full, Quenda suggests three free slots from aggregated history (no AI).
- **Change and cancel (C3)** within the council's notice period.
- **History and notices (C4):** upcoming bookings and history, in-app notices, email and Web Push
  for confirmations, changes, cancellations and reminders.
- **Personal calendars:** each booking as `.ics`, or a revocable `webcal://` subscription.
- **QR pass** for the door, also offline.
- **Installable app (PWA)** with each council's name, colour and icon.
- **Privacy:** versioned privacy notice per council, data download and account deletion.

### For the council (backoffice, `/admin/`)

- **Facilities (M1):** create and edit facilities and their courts or lanes, photos with
  alternative text, active, maintenance and closed states, closures with a reason (affected
  bookings are cancelled and notified).
- **Timetables and rules (M2):** opening hours as iCalendar (RFC 5545) with exceptions and `.ics`
  import, municipal holidays, slot duration, booking window, cancellation deadline, per-person
  limits, prices by user category, no-show penalties and season allocation to clubs.
- **Indicators (M3):** bookings, cancellations, occupancy by facility, court, weekday and hour,
  attendance and no-shows, and optional cookieless web analytics in the deployment's own Umami.
- **Day bookings** with municipal cancellation, the **door page** for access staff (QR scanning or a
  searchable list, works offline), **staff accounts**, the **audit log**, settings for branding,
  language, legal texts and the **accessibility statement**, and **data export**.

### For the provincial council or operator (`/admin/operador`)

- One instance serves many councils, with strict data isolation between them (R3).
- The operator creates councils and their managers and reads aggregated indicators.

### Standards and conditions (T1–T5)

| ID | Requirement | How Quenda meets it |
|---|---|---|
| T1 | Free software | AGPL-3.0-or-later; every dependency checked by `npm run licenses` against an allowlist |
| T2 | Open, responsive and modular web | Three independent frontends and a modular REST API (OpenAPI 3); works from 320 px to desktop |
| T3 | Public authentication and open standards | OpenID Connect for Cl@ve/Chave365 (Keycloak as reference provider), sign-in by email code, local staff accounts with TOTP; iCalendar, OpenAPI, CSV/JSON, schema.org JSON-LD, GeoJSON, DCAT-AP-ES open data, full municipal data export and import |
| T4 | GDPR and secure user management | Data minimisation, consent and versioned notices, retention job, audit log, encrypted personal data, scrypt passwords and TOTP, rate limits, CSP and security headers |
| T5 | WCAG 2.1 AA (RD 1112/2018, EN 301 549) | Self-assessed matrix of all 50 criteria in [accessibility.md](docs/architecture/accessibility.md), 50 axe scans on every change, per-council accessibility statement. No certification is claimed |

## Try it on your computer

Requires Node 24, npm and Docker with Compose.

```bash
npm ci
```

```bash
npm run setup
```

```bash
npm run dev
```

`npm run setup` starts PostgreSQL and Mailpit in Docker, applies the migrations and loads two
synthetic councils, **Portomar** and **Vilaverde**. It can be run again without overwriting data.
`npm run dev` starts the API, the notice worker and the three frontends with demo sign-in enabled.

| What | Where |
|---|---|
| Public website | http://127.0.0.1:5173 |
| Citizen app | http://127.0.0.1:5173/app/ |
| Council backoffice | http://127.0.0.1:5173/admin/ |
| Operator area | http://127.0.0.1:5173/admin/operador |
| Email sent by the demo (Mailpit) | http://127.0.0.1:8025 |
| API documentation (Swagger, OpenAPI) | http://127.0.0.1:3001/api/docs, `/api/openapi.json` |

**Demo accounts:** **Entrar** offers *Entrar como cidadanía* in the app and *Entrar como xestor/a*
or *Entrar como control de accesos* in the backoffice. Switching council signs out. Nothing in the
demo makes a real booking or charges money.

**Optional services:**

- `npm run identity:up` starts Keycloak with a **simulated Cl@ve** at http://127.0.0.1:8081; set
  the OIDC variables from [`.env.example`](.env.example) and restart `npm run dev` to see
  *Entrar con Cl@ve* ([public identity](docs/architecture/identity.md)).
- `npm run analytics:up` and `npm run analytics:setup` start a local Umami
  ([analytics](docs/architecture/analytics.md)).
- `npm run access:simulator` stands in for a door lock controller ([access control](docs/architecture/access-control.md)).

Ports: website 5173, app 5174, backoffice 5175 (the website proxies both and the API, so one
origin serves everything), API 3001, PostgreSQL 55432, Mailpit 1025/8025. Data persists in the
`quenda_quenda-data` volume; `docker compose stop` stops the database without losing it.

### Everything in containers

```bash
docker compose -f compose.yml -f compose.demo.yml up --build --wait
```

Builds the production images and serves the demo at http://127.0.0.1:8080 (`/`, `/app/`,
`/admin/`), with migrations, seed data, the worker and Mailpit. Ports bind to loopback only.

## Install it on a server

One Linux server with Docker runs a whole instance: PostgreSQL, the API, the notice worker, the
web container, Caddy with automatic HTTPS, the daily retention job and nightly encrypted backups.
Nothing depends on a particular provider. The full guide, for council and *deputación*
technicians, is in Spanish: [operations guide](docs/operacion/README.md).

**Requirements:** 2 vCPU, 4 GB RAM and 40 GB SSD for a small council (2 GB is enough for a demo or
small pilot); Debian 12 or Ubuntu 24.04 with Docker Engine and Compose v2; a domain pointing at the
server; ports 80 and 443 open; an SMTP provider for notices and sign-in codes.

```bash
sudo git clone https://github.com/DavidPombar/quenda.git /opt/quenda
```

```bash
cd /opt/quenda && sudo QUENDA_DOMAIN=reservas.concello.gal SMTP_URL=smtp://user:pass@smtp.example:587 MAIL_FROM=reservas@concello.gal sh deploy/install.sh
```

[`deploy/install.sh`](deploy/install.sh):

- adds swap on small servers, turns on automatic security updates and limits SSH to keys;
- writes `deploy/.env` (domain, database, backups) and `deploy/quenda.env` (application secrets)
  with fresh secrets, readable only by root. **Keep a copy of both outside the server**: without
  `QUENDA_DATA_KEY` the encrypted data cannot be read, and without `RESTIC_PASSWORD` no backup can;
- builds the images and starts [`deploy/compose.prod.yml`](deploy/compose.prod.yml).

It can be run again: it keeps existing settings and rebuilds and restarts the containers. That is
also how to **update**: `git pull` (or check out a release tag) and run it again; migrations run
when the API starts ([upgrades](docs/operacion/actualizacion.md)).

**A public demo** uses the same script with `DEMO_MODE=true`: synthetic councils and accounts, and
sign-in by email off. Without a domain of your own, `<ip-with-dashes>.sslip.io` works with Let's
Encrypt. The reference demo runs on a Hetzner CPX12 created with the `hcloud` CLI
([example](docs/operacion/despliegue-concello.md#ejemplo-servidor-en-hetzner-cloud)).

**First accounts.** Staff sign in with a login, a password and an authenticator app. Create the
operator, and if needed a council's first manager, on the server, inside `/opt/quenda`; the command
prints a temporary password once:

```bash
sudo docker compose -f deploy/compose.prod.yml exec api node backend/dist/database/staff.js create --operator --login operacion --name "Deputación · operación"
```

The operator then creates councils and their managers in the backoffice, and each manager creates
door staff under **Persoal** ([onboarding a council](docs/operacion/alta-concello.md)). Residents
sign in with Cl@ve/Chave365 through OpenID Connect, or with a one-time code by email.

**Check the instance:**

```bash
HEADERS_URL=https://reservas.concello.gal EXPECT_SECURE_COOKIE=true npm run test:headers
```

| | Demo | Production |
|---|---|---|
| Accounts | `DEMO_MODE=true`: one-click synthetic accounts | Cl@ve/Chave365 or email code for residents, local accounts with TOTP for staff |
| Data | Synthetic councils | None; the operator creates councils |
| Transport | HTTPS through Caddy (plain HTTP only on loopback with `compose.demo.yml`) | HTTPS with HSTS; `Secure` cookies |
| Operation | Same images and Compose file | Plus off-server backups ([backups](docs/operacion/copias-de-seguridad.md)), [support](docs/operacion/soporte.md) and the [rollout plan](docs/operacion/plan-implantacion.md) |

All settings are listed in [`.env.example`](.env.example) (development) and
[`deploy/prod.env.example`](deploy/prod.env.example) / [`deploy/quenda.env.example`](deploy/quenda.env.example) (production).

## How it is built

```
frontend/web     public website (/)                  React + Chakra UI + Vite
frontend/app     citizen app (/app/), installable    React + Chakra UI + Vite + service worker
frontend/admin   backoffice and operator (/admin/)   React + Chakra UI + Vite
backend          REST API (/v2) and notice worker    NestJS, PostgreSQL 17
deploy           production Compose, installer, Caddy, nginx, Keycloak realm
docs             architecture, operations, legal templates, contest context
scripts          architecture check, licences, smoke test with axe, headers, tools
```

- **Three independent frontends.** Each has its own router, styles, build and tests; they share no
  source and link to each other with ordinary links. Inside each: route → view → controller →
  query or mutation (TanStack Query) → repository → API client. One component per homonymous
  folder, views without data access, Chakra `NativeSelect` for every select.
- **Backend in modules** (`backend/src/v2/modules`: bookings, facilities, identity, notifications,
  insights, seasons, access, open data, portability, retention…), each with `domain`,
  `application` and `infrastructure`. One endpoint per controller; commands and queries return
  typed `Result`s; commands own the transaction and never perform external effects; time comes from
  an injected `Clock` and ids from an `IdGenerator`; the municipality always comes from the
  session.
- **Data.** PostgreSQL with numbered, checksummed migrations
  ([migrations](docs/architecture/migrations.md)); opening hours and calendars are iCalendar text;
  all time arithmetic uses Temporal ([calendars](docs/architecture/calendars.md)). Notices and audit
  events commit with the booking (outbox) and the worker delivers them.

More in [implementation](docs/architecture/implementation.md) and the
[design guidelines](docs/architecture/design-guidelines.md).

## Develop and test

```bash
npx playwright install chromium
```

```bash
npm run check
```

```bash
npm run licenses
```

```bash
npm run test:smoke
```

- `npm run check` runs the architecture check, lint, types, unit tests, browser tests (Vitest
  Browser Mode with real providers and accessible selectors), HTTP tests against disposable
  PostgreSQL databases, and all builds. CI runs the same on every pull request.
- `npm run licenses` checks every installed dependency against the free-software allowlist.
- `npm run test:smoke` needs `npm run dev`: a real browser goes website → app → backoffice →
  operator, makes, moves and cancels a booking, checks reflow at 320 and 390 px and runs 50 axe
  scans (WCAG 2.1 A/AA). Screenshots and reports go to `.dev-logs/`.

HTTP tests never touch the development database; the PostgreSQL account needs `CREATEDB`
(`TEST_DATABASE_URL` points elsewhere if needed). Other useful commands: `npm run db:migrate`,
`npm run db:seed`, `npm run db:retention`, `npm run db:import -- <file> [--slug new]`,
`npm run staff -- create|reset …` and `npm run format`.

## Developing with AI agents

Quenda is written to be extended by coding agents (Claude Code, Codex, Cursor and similar) as well
as by people. The project gives an agent the context it needs, rules it cannot break silently and
checks that tell it, and the reviewer, when something is wrong.

### Context the agent reads first

- **[`AGENTS.md`](AGENTS.md)**, the standard instructions file most agents read on their own. It
  imports the contest context (scope, technical requirements, evaluation and the official template),
  states the rules that cannot be broken (free software only, WCAG 2.1 AA, everything municipal is
  configuration, think of a small council, cite requirement IDs) and summarises the engineering
  conventions of the frontends and the backend.
- **[`CLAUDE.md`](CLAUDE.md)** imports `AGENTS.md` for Claude Code and adds what is specific to it:
  how to start the development stack in its built-in browser and when to check accessibility.
- **Architecture documents** in [`docs/architecture`](docs/architecture), one per area (identity,
  notifications, calendars, open data, data protection, accessibility…), written so an agent can
  load just the one it needs.

### Guardrails that fail loudly

- **`scripts/check-architecture.mjs`** (part of `npm run check`) turns the conventions into errors
  with a plain message: views cannot reach the data layer, controllers must use query or mutation
  hooks, frontends cannot import each other, the domain cannot depend on frameworks, application
  code cannot depend on infrastructure, commands must use `Clock` and `IdGenerator`, one endpoint
  per controller, no barrel files, `NativeSelect` for selects. An agent that drifts gets told
  exactly what to change.
- **Tests that check behaviour, not implementation.** Browser tests drive the real app through
  accessible roles and names, so they also catch accessibility regressions; HTTP tests run the real
  Nest app against a real, disposable PostgreSQL. Internal business logic is never mocked, so
  passing tests mean the feature works.
- **The smoke test with axe** catches any new WCAG violation on 50 screens; known violations must
  be listed against an issue.
- **`npm run licenses`** blocks a dependency with a non-free licence, which agents add easily.
- **CI** runs all of the above on every pull request; work goes through a branch and a pull
  request, never straight to `main`.

### Tools for Claude Code

- **[`.claude/launch.json`](.claude/launch.json)** starts the whole stack (`quenda-dev`) for the
  built-in browser, so the agent can open the app, sign in with the demo buttons and check its own
  change instead of asking a person to.
- **The `accesibilidade` skill** ([`.claude/skills/accesibilidade/SKILL.md`](.claude/skills/accesibilidade/SKILL.md)):
  after a significant frontend change (a new screen or dialog, a shared component, the theme, the
  booking or a sign-in flow) the agent runs it without being asked. It injects axe into the page,
  walks the screen with the keyboard, reads the accessibility tree, checks 320 px reflow, 200 %
  zoom and text spacing, reports against the WCAG matrix and proposes an issue for each new problem.
  `node scripts/axe-page.mjs <url>` is the headless fallback.

### A typical change

1. Start from an issue that cites its requirement IDs (for example *C3* or *T5 · 2.4.3*).
2. The agent reads `AGENTS.md`, the relevant architecture document and the code, and proposes a
   plan; non-trivial changes are agreed before coding.
3. It works on a branch, following the layering; a migration gets the next number and its note in
   [migrations](docs/architecture/migrations.md).
4. It adds or updates browser and HTTP tests, runs `npm run check`, `npm run licenses` and, with
   `npm run dev`, `npm run test:smoke`, and checks the change in the browser.
5. It updates the documents the change affects: the WCAG matrix for an accessibility criterion,
   the architecture page of the area, the operations guide for anything a technician runs.
6. It opens a pull request describing what changed and how it was verified; a person reviews and
   merges.

To teach agents a new recurring procedure, add a skill under `.claude/skills/<name>/SKILL.md` (a
short description of when to use it and the steps) and mention it in `CLAUDE.md`; rules that apply
to every agent belong in `AGENTS.md`.

## Limits of this version

Quenda is a working V0 with synthetic data, not yet a service processing residents' personal data.
Still to do before a real pilot: production onboarding with Cl@ve/Chave365, an independent security
review and an external accessibility review with assistive technology
([#77](https://github.com/DavidPombar/quenda/issues/77)), SMS notices, rate limiting shared across
API replicas, server-side pagination of long histories, payments and shared capacity (several
people in one lane). No GDPR, ENS or WCAG certification is claimed; councils can start from the
Spanish templates for the [record of processing activities](docs/legal/registro-actividades-tratamiento.md)
and the [processor agreement](docs/legal/contrato-encargado-tratamiento.md), to be reviewed by
their data protection officer.

## Documentation

| Area | Documents |
|---|---|
| Operations (Spanish) | [Guide](docs/operacion/README.md) · [council deployment](docs/operacion/despliegue-concello.md) · [deputación deployment](docs/operacion/despliegue-deputacion.md) · [onboarding](docs/operacion/alta-concello.md) · [backups](docs/operacion/copias-de-seguridad.md) · [upgrades](docs/operacion/actualizacion.md) · [support](docs/operacion/soporte.md) · [rollout plan](docs/operacion/plan-implantacion.md) · [ENS kit](docs/operacion/ens) |
| Architecture | [Implementation](docs/architecture/implementation.md) · [identity](docs/architecture/identity.md) · [notifications](docs/architecture/notifications.md) · [calendars](docs/architecture/calendars.md) · [catalogue](docs/architecture/catalogue.md) · [seasons](docs/architecture/seasons.md) · [access control](docs/architecture/access-control.md) · [installable app](docs/architecture/pwa.md) · [analytics](docs/architecture/analytics.md) · [migrations](docs/architecture/migrations.md) |
| Data and rights | [Open data](docs/architecture/open-data.md) · [data portability](docs/architecture/data-portability.md) · [data protection](docs/architecture/data-protection.md) · [legal templates](docs/legal) |
| Accessibility and design | [WCAG 2.1 AA matrix](docs/architecture/accessibility.md) · [design guidelines](docs/architecture/design-guidelines.md) |
| Contest | [Scope](docs/contexto/01-alcance-funcional.md) · [technical requirements](docs/contexto/02-requisitos-tecnicos.md) · [evaluation](docs/contexto/03-concurso-presentacion-valoracion.md) · [roadmap](docs/memoria/roadmap.md) · [research](docs/investigacion/00-resumen-ejecutivo.md) |

## Contributing and licence

Quenda is published as a reusable public asset under the
[GNU Affero General Public License v3.0 or later](LICENSE). See [CONTRIBUTING.md](CONTRIBUTING.md),
the [security policy](SECURITY.md), the [code of conduct](CODE_OF_CONDUCT.md), the
[changelog](CHANGELOG.md) and the [publiccode.yml](publiccode.yml) catalogue metadata.
