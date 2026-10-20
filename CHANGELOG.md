# Changelog

All notable changes to Quenda are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project will use
[Semantic Versioning](https://semver.org/) from its first tagged release.

## [Unreleased]

### Added

- Versioned database migrations with a `schema_migrations` record, checksums and an
  advisory lock; V0 databases are adopted without data loss (#6, R1).
- Reuse metadata: `publiccode.yml`, `CONTRIBUTING.md`, `SECURITY.md`,
  `CODE_OF_CONDUCT.md` and this changelog (#19).

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
