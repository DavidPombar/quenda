# Municipality data portability (criterion 4, T3, R3)

A municipality can take all of its data to another Quenda instance, or to another
provider, without asking anyone: this is the bases' «portabilidade íntegra dos
datos». The package is plain JSON, documented by a versioned JSON Schema
([`export-format.schema.json`](export-format.schema.json)).

## Export

A manager downloads the package from the backoffice (**Exportar datos**) or with
`GET /v2/manager/export`. The municipality always comes from the session; a
manager can only export their own. The file is named
`quenda-<slug>-<YYYY-MM-DD>.json` and contains:

| Field | Content |
|-------|---------|
| `format`, `version` | `quenda-municipality-export`, `1` |
| `exportedAt` | ISO 8601 instant |
| `municipality` | Settings: slug, name, time zone, language, booking rules, contact, legal text |
| `facilities` | Every facility, including closed ones, with its RFC 5545 opening calendar verbatim |
| `users` | Minimum account data: id, display name, role. Never sessions or credentials |
| `bookings` | Every booking, confirmed and cancelled, with instants in UTC |
| `notifications` | In-app notices |
| `auditEvents` | The audit trail |

All collections are read in one SQL statement, so they form a single consistent
snapshot. The export itself is recorded as a `municipality.exported` audit event
in the same transaction, which is why it is a command and not a query. The package
contains personal data (display names and reservation history): store and send it
as such (T4).

## Import

```sh
npm run db:import -- quenda-portomar-2026-10-20.json [--slug new-slug]
# inside the api container:
node backend/dist/database/import.js /path/to/file.json
```

The import applies pending migrations, then loads the whole package in one
transaction: it imports everything or nothing. Identifiers are kept (they are
UUIDs), so references between records stay valid. `--slug` changes the public
identifier when the target already uses that slug. A municipality whose id already
exists in the target is refused: the import neither merges nor clones.

## Versioning

- `version` changes only when a field is removed, renamed or changes meaning.
  Adding an optional field keeps the version.
- The importer accepts the versions listed in `SUPPORTED_VERSIONS` and refuses the
  rest instead of guessing.
- Each new version gets its own schema file; old ones are kept.

New data (organizations, season allocations, fees, resources) is added to the
package as it is implemented, so a migration never needs manual work. CSV exports
are not part of this version.
