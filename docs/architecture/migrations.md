# Database migrations (R1)

The schema lives in numbered SQL files under `backend/src/database/migrations/`
(`NNNN_snake_case.sql`). `npm run db:migrate`, the `api` container start command and
the HTTP tests all call the same runner, `backend/src/database/migrate.ts`.

- Applied versions are recorded in `schema_migrations` with a SHA-256 checksum.
- Each pending file runs in its own transaction, in filename order. A failure rolls
  that file back and stops the run.
- A PostgreSQL advisory lock serializes concurrent runners, so several API
  containers can start at once.
- Applied files are immutable. Editing one makes the runner refuse to continue;
  schema changes always go in a new file.
- `0001_initial.sql` is the V0 schema. It keeps `IF NOT EXISTS`, so a database
  created by the V0 is adopted without data loss on the first run.
- `0001` and `0002` retain their original checksums. `0003` adopts the schema from
  `main` at `d6d45be`, including privacy, municipal settings, attendance and email.
  Both an original V0 database and an existing unversioned `main` database can
  upgrade without recreating their data (R1, R3, T4).
- `0004` updates calendar revisions for every booking mutation, including
  municipal cancellations, and allows retention to remove obsolete feed owners.
- `0005` adds courts and divisible spaces (`resources`, `booking_units`). Every
  existing facility gets a default resource with its own id, existing reservations
  point at it and keep their occupied slot, and the per-facility exclusion constraint
  is replaced by the per-unit one. A change of court also bumps the calendar revision.
- `0006` adds the open data settings: each municipality's `data_license`
  (CC BY 4.0 by default) and `dir3_code`, and optional facility coordinates.
- `0007` adds public identity: the municipality's `store_nif` opt-in, each account's
  `assurance`, the encrypted NIF and its digest, `identities` (OIDC issuer and subject)
  and short-lived `login_attempts`. It is numbered after the courts (`0005`) and open
  data (`0006`) migrations proposed in parallel, so the versions never collide;
  the three are independent and can be applied in any order.

Contributions based on the former `backend/src/database/schema.sql` must move
their new schema changes into the next numbered migration instead of restoring
that file. HTTP tests use the migration runner through the shared harness.

Migrations must preserve existing municipal data: add columns with defaults or a
backfill, and move data explicitly when a table is split. Rollbacks are done by
restoring a backup taken before the upgrade, not by down migrations.

- `0008` adds municipal accessibility statement settings (T5). Existing migration checksums stay unchanged; exports preserve all statement fields (R1, R3).

- `0009` adds category tariffs and preserves the price applied to each reservation (M2, R2). Municipal transfers include category decisions, facility prices and preferences (T3, R3).

- `0010` records facility status history for date-range occupancy (M3). Transfers preserve this history (T3, R3).
