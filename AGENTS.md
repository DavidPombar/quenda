# I Certame GOBTEC de Software Libre — Plataforma de reserva de instalaciones deportivas municipales

Este proyecto es una propuesta para el I Certame GOBTEC (AGASOL). Todo el desarrollo
debe cumplir las normas del concurso descritas en estos ficheros de contexto:

@docs/contexto/01-alcance-funcional.md
@docs/contexto/02-requisitos-tecnicos.md
@docs/contexto/03-concurso-presentacion-valoracion.md
@docs/contexto/04-plantilla-memoria-tecnica.md

Investigación de mercado (software libre, comercial, sector público y stack) en
`docs/investigacion/`, resumen en `docs/investigacion/00-resumen-ejecutivo.md`.

## Reglas que no se pueden saltar
- Solo software libre (licencia OSI/FSF) en el código y en todas las dependencias.
- Web responsive y modular, estándares abiertos, RGPD y accesibilidad (WCAG 2.1 AA).
- Cubrir primero las funcionalidades obligatorias (ciudadanía, concello, reutilización)
  y después las opcionales (app, calendarios, QR, analítica).
- Todo lo que dependa del municipio es configuración; la solución es multi-municipio.
- Pensar siempre en un concello pequeño con pocos recursos técnicos.
- Entrega: memoria técnica en PDF de máx. 10 páginas con la plantilla oficial, antes
  del 19/11/2026 a las 23:59 h.

Cuando una decisión técnica afecte a un requisito, citar su ID (C1–C4, M1–M3, R1–R3, T1–T5).

## Engineering

Read `docs/contexto/01-alcance-funcional.md` and `02-requisitos-tecnicos.md` before changing product behavior. Preserve the existing competition documents. Trace work to C1–C4, M1–M3, R1–R3 and T1–T5.

Engineering artifacts are written in English. User-facing strings are localized in Galician and Spanish, with Galician as the default. All code and dependencies must be free software. New source files use an AGPL-3.0-or-later SPDX header.

Follow the TrainerStudio frontend architecture, frontend testing and backend v2 conventions summarized in `docs/architecture/implementation.md`. PostgreSQL replaces Mongoose; retain v2 boundaries, Result folding, scoped authorization and transactional commands.

- Frontend: independent `frontend/web` (public website at `/`), `frontend/app` (citizen application at `/app/`) and `frontend/admin` (municipal backoffice at `/admin/`) workspaces. Keep citizen and manager navigation, sign-in choices and operational code in their respective workspace. No cross-workspace source imports; navigate between them with ordinary links. All select fields use Chakra `NativeSelect`. Within each workspace: route → view → controller → query/mutation → repository → singleton client. One component per homonymous folder and `.view.tsx`. Children live recursively inside their owner's `components/`. No barrels or upward/sibling imports. Use the `@/` alias across roots. Deliberately invalidate affected server cache after writes.
- Backend: new endpoints live under `backend/src/v2/`, one endpoint per controller. Commands and queries return typed `Result`s. Only entry points use `Commands`/`Queries`; expected errors are values. HTTP DTOs belong to infrastructure. Repositories are abstract domain contracts. Protected tenant scope comes from the authenticated session.
- `Commands` owns transactions. All persistence goes through `Database`, which propagates its connection with AsyncLocalStorage. No external effects inside commands. Notifications and audit events commit with the reservation.
- All time calculations use `@js-temporal/polyfill`. Commands use the injected `Clock`; no ambient time. Opening hours are RFC 5545 iCalendar text, never bespoke JSON. Derived slots are read models, not stored calendars.
- Test application behavior with Vitest Browser Mode, real app providers/router, accessible selectors and HTTP stubs. Backend tests run the real Nest app against disposable PostgreSQL databases. Do not mock internal business logic.
- Run `npm run check`, `npm run licenses`, and, with the dev server running, `npm run test:smoke`. Verify mobile layout and accessible dialogs. Do not claim production GDPR, ENS or WCAG certification.
