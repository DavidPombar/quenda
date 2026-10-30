# Changelog

All notable changes to Quenda are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project will use
[Semantic Versioning](https://semver.org/) from its first tagged release.

## [Unreleased]

### Added

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
