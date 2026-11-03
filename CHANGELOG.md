# Changelog

All notable changes to Quenda are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project will use
[Semantic Versioning](https://semver.org/) from its first tagged release.

## [Unreleased]

### Changed

- One deployment (#67, R1): the one-server setup from `deploy/server` is merged into
  `deploy/compose.prod.yml`. `deploy/install.sh` prepares the server (swap, security updates,
  SSH by key), writes both settings files with new secrets and starts it; `DEMO_MODE=true`
  runs the same setup as a public demo. Backups and retention stay in Compose (restic,
  off-site), not in the host's cron.

### Fixed

- Accessibility (T5): form fields and unchecked checkboxes get a `#76837b` border, 3.96:1 on
  white (#91, WCAG 1.4.11). The backoffice navigation wraps between 561 and 800 px, so the
  backoffice no longer scrolls sideways at 200 % zoom; the smoke test now also checks 640 px
  (#90, 1.4.10). Focus moves to the page heading after signing in and to the slot list after the
  booking confirmation, instead of falling to the page body (#89, 2.4.3).

### Added

- Attendance and indicators for activities, part D (#97, M3): the gate page gains «Actividades de
  hoxe» to take the roll of each session by first name, «Presente» or «Ausente», offline if
  needed; the latest mark wins and absences carry no penalty. Indicators and their CSV add places,
  enrolment, sessions and attendance rate per activity, and open data adds the count of people
  enrolled. Transfers and account exports include the marks. Closes #97.

- People in an adult's care, part C (#97, C2, T4): under «A miña conta» an adult adds children or
  other people in their care by first name and year of birth only, declaring parental authority or
  guardianship (versioned). Activity pages ask «Para quen?» and offer only those of the right age,
  checked again by the server. The council's list and CSV show the participant's first name and
  age; notices name them by email only. Account export and deletion, portability and the data
  protection documents cover them.

- Enrolment in activities, part B (#97, C2, C4, M2): adults enrol from the activity's page; past
  the places they join a waiting list and the first person waiting gets a freed place on their own,
  with a notice. Leaving, removal by the council with a reason, account deletion and new places all
  move the queue. Cancelled dates and cancelled activities tell the people enrolled once, by the
  channels they chose. «As miñas reservas» gains an «Inscricións» tab, the calendar subscription
  carries the sessions, and the backoffice lists the people page by page and downloads them as an
  audited CSV. Exports, account exports and retention include enrolments.

- Activities and sports schools, part A (#97, C1, M1, M2): managers publish courses with places,
  ages, informative prices, an enrolment period and a weekly RFC 5545 rule; each session holds its
  court in `booking_units`, and dates that clash with bookings, clubs, other activities or the
  opening hours are listed to become dates without a session. Sessions can be cancelled one by one
  or with the activity, and a facility closure cancels them. The citizen app lists the activities
  with filters and numbered pages, each with its own page, and facility pages link them. Open data
  adds `activities.json` and `activities.csv`; exports carry activities, prices and sessions.

- Shared capacity (#95, C2, M1): a court without parts can take a capacity of 2–200 places, so
  several people book the same slot of a pool lane or a room. The server counts places under the
  facility lock and refuses a second place for the same person (`already_booked`); the citizen
  app says how many places are left, and indicators count occupancy by place. The demo opens
  Portomar's pool with four lanes of six places.

- Production deployment and operations (#27, R1, T4): `deploy/compose.prod.yml` with Caddy
  TLS, nightly encrypted restic backups with pruning and checks, a daily retention job and
  migrations on start; and an operations guide in `docs/operacion/`
  covering deployment with Compose or Coolify, onboarding, backup and restore, upgrades,
  support, a 12-week rollout plan and a draft basic-category ENS kit.
- Versioned database migrations with a `schema_migrations` record, checksums and an
  advisory lock; V0 databases are adopted without data loss (#6, R1).
- Reuse metadata: `publiccode.yml`, `CONTRIBUTING.md`, `SECURITY.md`,
  `CODE_OF_CONDUCT.md` and this changelog (#19).
- Municipal privacy rights, consent history, audit and retention (T4), editable
  settings and branding (R2, M2), attendance and cancellations (C3, M3), and
  transactional email notices and reminders (C4), integrated from `main`.
- Complete municipal export/import, including the current lifecycle and email
  data, with a versioned JSON format and backward-compatible import (#7, T3, R3).
- Personal iCalendar downloads and revocable subscriptions, including municipal
  cancellations and revocation when an account is deleted (#22, C3, C4, T3, T4).
- Deployment headers, Secure cookies, per-process rate limits and periodic
  expired-session cleanup (#10, T4).

## [0.1.0] - 2026-10-18

First working prototype (V0) for the I Certame GOBTEC proposal.

### Added

- Public website (`/`), citizen application (`/app/`) and municipal backoffice
  (`/admin/`) as independent frontends, in Galician and Spanish (T2).
- Facility catalog with search, sport filters and real availability (C1).
- Online reservation with atomic overlap protection and per-person quotas (C2).
- Rescheduling and cancellation within the municipality's notice period (C3).
- Booking history and in-app notices (C4).
- Facility administration with states, RFC 5545 opening calendars and rules (M1, M2).
- Seven-day occupancy and cancellation indicators (M3).
- Multi-municipality data isolation, container images and demo seed data (R1–R3).
- NestJS API with OpenAPI documentation and PostgreSQL 17 (T3).
- Automated accessibility scans with axe and a browser smoke flow (T5).
- License allowlist check for all dependencies (T1).

### Changed

- Dependencies updated and V0 follow-ups closed (2026-10-18).
