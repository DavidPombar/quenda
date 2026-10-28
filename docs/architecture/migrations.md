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

Migrations must preserve existing municipal data: add columns with defaults or a
backfill, and move data explicitly when a table is split. Rollbacks are done by
restoring a backup taken before the upgrade, not by down migrations.
