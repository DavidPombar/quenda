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
| `format`, `version` | `quenda-municipality-export`, `2` |
| `exportedAt` | ISO 8601 instant |
| `municipality` | All persisted settings, including branding, holidays, retention, no-show rules, email configuration, enabled categories, identity and accessibility statement settings, and the open data licence and DIR3 code |
| `facilities` | Every facility, including closed ones, with its RFC 5545 opening calendar verbatim and its optional coordinates |
| `resources` | Courts and spaces of each facility, parents before their parts, including out-of-service ones. Optional: a package without them gets one resource per facility, with the facility's id |
| `users` | Id, display name, role, deletion state, email, preferred language and identity assurance; the NIF only where residency is verified, still encrypted, plus the family-tariff preference, so the destination needs the same `QUENDA_DATA_KEY` to read it |
| `identities` | Identity provider issuer and subject of each account, so people sign in to the same account after the move |
| `facilityStatusPeriods` | Facility status history for reproducible range indicators. Optional in older packages, which fall back to the current status. |
| `facilityPrices`, `userCategories` | Category prices and verification/request records, including nullable decision times. Optional for older packages. |
| `bookings` | All statuses, including no-shows and anonymised history, the booked court (`resourceId`), the applied tariff and price, cancellation details and calendar revision. The occupied units are derived on import from the court and its parts |
| `notifications` | In-app notices and their details |
| `auditEvents` | Audit trail, including nullable actors, actor role and details |
| `consents`, `legalTexts` | Accepted privacy notice versions and their complete bilingual texts |
| `logos` | Image bytes encoded as base64, content type, hash and update time |
| `bookingBlocks` | No-show penalties and their lifting history |
| `notificationPreferences` | Reminder opt-outs and their update time |
| `messages` | Transactional email outbox, including delivery state, attempts and deduplication keys |

Sessions and calendar subscription credentials are deliberately excluded. People
sign in again and create new subscription links on the destination. Deleted
accounts remain deleted. Stop source writes and the email worker for the final
transfer, and only run the destination worker afterwards: a snapshot does not
coordinate two live deployments or prevent both from sending a pending message.

All collections are read in one SQL statement, so they form a single consistent
snapshot. The export itself is recorded as a `municipality.exported` audit event
in the same transaction, which is why it is a command and not a query. The package
contains personal data (contact information, consents and reservation history): store and send it
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
- Version 2 includes the municipal lifecycle, attendance and email data introduced
  on `main`, and permits anonymised booking owners and audit actors. The importer
  also accepts [version 1](export-format.v1.schema.json), using database defaults
  for fields absent from those older packages and preserving their legacy notice.

New data (organizations, season allocations, fees) is added to the
package as it is implemented, so a migration never needs manual work. CSV exports
are not part of this version.
