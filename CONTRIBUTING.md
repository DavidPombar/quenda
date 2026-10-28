# Contributing to Quenda

Thank you for helping build a reusable public service. Quenda is free software under
AGPL-3.0-or-later and is developed for municipalities with few technical resources.

## Before you start

- Read [AGENTS.md](AGENTS.md): it summarizes the competition rules, the requirement IDs
  and the engineering conventions. The architecture is described in
  [docs/architecture/implementation.md](docs/architecture/implementation.md).
- Open or comment on an issue before large changes, so the behavior can be agreed first.
- Product behavior must trace to a requirement ID (C1–C4, M1–M3, R1–R3, T1–T5) or to an
  optional feature of the competition scope.

## Conventions

- Engineering artifacts (code, comments, technical docs) are written in English.
  User-facing strings are localized in Galician (default) and Spanish.
- Every new source file starts with an SPDX header:
  `// SPDX-License-Identifier: AGPL-3.0-or-later` (or the comment syntax of the file).
- Only free-software dependencies (OSI/FSF licenses). No proprietary SDKs or services.
- Anything that depends on a municipality is configuration, never code.
- Schema changes go in a new numbered migration; applied migrations are never edited
  (see [docs/architecture/migrations.md](docs/architecture/migrations.md)).
- Accessibility (WCAG 2.1 AA) and data minimization (GDPR) are part of every change.

## Checks

```sh
npm run check      # architecture, lint, types, unit/browser/HTTP tests, builds
npm run licenses   # dependency license allowlist
npm run test:smoke # with `npm run dev` running: real browser flow + axe scans
```

Verify the mobile layout and keyboard/screen-reader use of any dialog you touch.

## Pull requests

- One topic per pull request. Reference the issue (`Closes #N`) and the requirement IDs
  the change covers.
- Describe what you verified and how. Do not claim GDPR, ENS or WCAG certification.
- We recommend signing off your commits (`git commit -s`) to certify the
  [Developer Certificate of Origin](https://developercertificate.org/). Code generated
  with AI tools is reviewed like any other contribution, and you must have the right to
  license it.

## Security issues

Do not open public issues for vulnerabilities. Follow [SECURITY.md](SECURITY.md).
