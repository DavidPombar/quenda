# Data protection lifecycle (T4)

This document describes how Quenda handles personal data: what is stored, why, for how long, which
rights are supported and what remains outside the prototype. It is engineering documentation for
the people who deploy and operate Quenda. It is not legal advice and does not claim GDPR, LOPDGDD or
ENS compliance. The council-facing templates in [`docs/legal/`](../legal/) build on it and must be
reviewed by the council's data protection officer (DPO) before use.

## Roles

| Role          | Who                                                                                                             | Basis                                                                                                                           |
| ------------- | --------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| Controller    | Each council (_concello_) for its own facilities and residents                                                  | Art. 4.7 GDPR                                                                                                                   |
| Processor     | The operator of a shared deployment: a provincial _deputación_, a _mancomunidade_, AMTEGA or a private provider | Art. 28 GDPR; contract template in [`docs/legal/contrato-encargado-tratamiento.md`](../legal/contrato-encargado-tratamiento.md) |
| Sub-processor | Hosting and backup providers chosen by the processor                                                            | Art. 28.2 and 28.4 GDPR                                                                                                         |

A council that hosts its own instance is controller and operator at once and needs no processor
contract. Every table carries `tenant_id`; protected operations derive it from the server-side
session, so one council's managers never read another council's data (R3).

## Lawful basis and the privacy notice

Booking municipal sports facilities is a public service within municipal competences (Ley 7/1985,
art. 25.2.l). The expected lawful basis is therefore art. 6.1.e GDPR (public task), not consent;
the council confirms this in its record of processing activities.

What Quenda calls _consent_ is the person's acknowledgement of the council's privacy notice
(art. 13 GDPR) at a given version:

- `municipalities.legal_text` holds the notice and `municipalities.legal_version` its version. A
  new version is published by changing `legal_version`; editorial fixes may keep it.
- A citizen session can only be opened with the current version (`422 consent_required`
  otherwise). The acceptance is appended to `consents` (`legal_version`, `accepted_at`) and audited
  as `consent.accepted` in the same transaction.
- `GET /v2/citizen/me` exposes `consentUpToDate`, so a production identity flow can ask again after
  sign-in instead of at the demo login.

If a council ever relies on consent for an optional purpose (for example marketing messages), that
needs its own explicit, withdrawable record; `consents` is not that record.

## Data inventory

| Table                      | Personal data                                                                                                                                                                                                                  | Purpose                                                                                                                     | Retention                                                                                             |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `users`                    | `display_name`, `role`, `assurance`, `deleted_at`, `locale`; `email` when the identity provider sends it (demo citizens get a synthetic one); `nif_ciphertext` and `nif_digest` only when the municipality enables `store_nif`; `organization_id` when the person represents a club (#17) | Identify the person who books or manages; address and language for email notices; the NIF verifies residence for fees (#13) | Name, email, language, NIF and club link erased on deletion; row removed by retention once nothing references it |
| `identities`               | Identity provider issuer and subject identifier                                                                                                                                                                                | Recognise the person at the next sign-in                                                                                    | Deleted with the account                                                                              |
| `login_attempts`           | No personal data: hashed state, nonce, PKCE verifier, notice version                                                                                                                                                           | Complete an OIDC sign-in safely                                                                                             | Ten minutes; expired rows purged by retention                                                         |
| `sessions`                 | Hash of a random token, expiry                                                                                                                                                                                                 | Keep the person signed in for at most eight hours                                                                           | Removed at sign-out, deletion or expiry (retention purges expired rows)                               |
| `consents`                 | Accepted notice version and time                                                                                                                                                                                               | Prove the person was informed                                                                                               | Kept while the account exists; removed by retention after deletion                                    |
| `bookings`                 | Link from a reservation to `user_id`                                                                                                                                                                                           | Provide the reservation and its history                                                                                     | Link set to NULL once the reservation ended more than `retention_months` ago                          |
| `notifications`            | Link to `user_id` and a reservation                                                                                                                                                                                            | In-app notices                                                                                                              | Deleted on account deletion or after `retention_months`                                               |
| `outbox`                   | Link to `user_id`, a reservation, notice kind and delivery state; never the address or the text                                                                                                                                | Deliver email notices after the reservation commits                                                                         | Deleted on account deletion or after `retention_months`                                               |
| `notification_preferences`   | Each notice kind by email and by push, when it differs from the default                                                                                                                                                          | Respect the person's choice                                                                                                   | Deleted on account deletion                                                                             |
| `push_subscriptions`         | Push service endpoint and browser keys, user agent, date                                                                                                                                                                         | Deliver push notices to the devices the person turned on                                                                      | Deleted on account deletion or when the push service answers 404/410; not exported                      |
| `audit_events`             | `actor_id`, `actor_role`, `details`                                                                                                                                                                                            | Accountability for changes (art. 5.2 GDPR)                                                                                  | `actor_id` set to NULL after `retention_months`; action and details remain                            |
| `user_categories` | Category (e.g. resident, large family, disability), status and request/decision times; `users.prefers_family_tariff` | Apply the tariff the council sets for each category (M2) | Deleted on account deletion; the council's manager can revoke it at any time |
| `check_ins` | Link to a reservation, the time of entry and the staff member who recorded it | Evidence of attendance at the door | Deleted after `retention_months` |
| `access_keys` | None (signing keys; the private half is sealed) | Sign access passes | Kept; retired keys stop being published after 48 hours |

Facility photos (#26) are meant to show the space; the backoffice asks for a description of what
is seen, and managers should not upload pictures in which people can be identified. The facility
map loads tiles from the server set in `MAP_TILE_URL`. With the default, OpenStreetMap, each
visitor's IP address and user agent reach that third party when the map is shown, which the
privacy notice must say; a council can use its own or the provincial council's tile server.

Quenda does not collect identity documents, postal addresses, phone numbers, health data or data
about minors. It keeps the identifier the identity provider returns and the name it supplies; the
email address only when the provider sends one, used only for notices about the person's own
reservations; and the tax identifier (NIF) only when the municipality enables residence
verification, encrypted with AES-256-GCM under `QUENDA_DATA_KEY` and never in plain text. Demo
accounts carry fictitious names and synthetic addresses at the reserved `.example` domain, which the
local Mailpit catches. See [public identity](identity.md).

### QR access passes

A pass contains only the reservation, facility, municipality and validity window, never a name. Door
devices store the current day's list with each holder's first name, needed to greet and identify
people, and nothing else; it is replaced on every sync. Staff with the `access` role see no other
personal data. The access-control webhook sends no personal data at all.

### Email and push notices

Confirmations, changes and cancellations are part of providing the reservation (art. 6.1.b GDPR):
- by email, they are on by default when an address exists;
- push needs the person to turn it on in a browser, which asks for permission at that moment.

Every notice is kept in the app history, which is always kept. The person chooses each notice by
email and by push under **Conta e privacidade → Avisos**. The penalty notices (no-shows and blocks)
are off by default on both channels.

Every email has a signed link that switches that notice off by email
(`POST /v2/public/unsubscribe`). It asks for a click, so mail scanners cannot trigger it, and it
stops working once the person changes that choice again. Changes and unsubscriptions are audited
(`notification_preferences.updated`, `notification_preferences.unsubscribed`), and so is each
device turned on or off (`push_device.added`, `push_device.removed`).

Messages are written in the language the person last used in the app (`users.locale`). The outbox
stores no address or text: both are resolved when the worker sends, so nothing goes out once an
account is deleted.

**Push.** Push notices are encrypted end to end (RFC 8291) and pass through the push service of
the person's browser (Google, Mozilla, Apple…), which sees only the size and timing. The payload
names only the municipality and the kind of event: no names, places or times, because lock
screens can be seen by others. See [notices](notifications.md).

The `disability` category can reveal health data, a special category under art. 9 GDPR. The platform keeps only the category and whether it was verified: proof is checked outside the platform (V1: in person or by the council's own register; pasaXe! later) and no document is uploaded or stored. Each council decides whether to offer this category; the admin settings warn when it is enabled. Category decisions appear in the audit log (`category.*`) with the category name, so audit access stays limited to managers of the same council.

## Rights supported (arts. 15–22 GDPR)

| Right                                    | Implementation                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| ---------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Access and portability (arts. 15, 20)    | **A miña conta → Descargar os meus datos** calls `GET /v2/citizen/me/export`: a JSON attachment with profile (including the email address, language and decrypted NIF when stored), linked identities, consents, user categories and the family-tariff choice, every reservation, every notice, notice preferences, the devices receiving push notices (push service, browser and date; not the endpoint or keys), the messages queued or sent by email, push or webhook (kind and dates, no text) and the person's own audit events, without the paging limits of the history views. Audited as `account.exported`.                                                                                |
| Erasure (art. 17)                        | **A miña conta → Eliminar a conta** calls `DELETE /v2/citizen/me`. In one transaction: future confirmed reservations are cancelled regardless of the notice period, notices, queued messages, categories, notice preferences and push devices are deleted, the email address, language and NIF are cleared, linked identities are deleted, every session is revoked, `display_name` becomes «Conta eliminada» and `deleted_at` is set. Past reservations keep their anonymised row so indicators stay correct. Audited as `account.deleted` with the counts. |
| Information (arts. 13, 14)               | The council's notice is shown from the sign-in dialog and the account page, with the version the person accepted and the retention period.                                                                                                                                                                                                                                                                                                                                                                                         |
| Rectification (art. 16)                  | Name, email and NIF come from the identity provider and are refreshed at each sign-in, so corrections are made at the provider. Other requests go to the council.                                                                                                                                                                                                                                                                                                                                                                  |
| Restriction and objection (arts. 18, 21) | Not automated. The council handles requests manually; a manager can cancel the person's reservations and the operator can mark the account.                                                                                                                                                                                                                                                                                                                                                                                        |

Managers cannot export or delete their own accounts through these endpoints (`403 forbidden`);
staff accounts follow the council's internal procedures.

## Retention

Each municipality sets `retention_months` (1–120, default 24). `ApplyRetention` runs per
municipality inside a transaction with the injected clock. The cutoff is now minus
`retention_months`, computed in the municipality's time zone. It then:

1. detaches `user_id` from reservations that ended before the cutoff;
2. deletes notices and outbox messages created before the cutoff;
3. sets `actor_id` to NULL on audit events before the cutoff;
4. deletes expired sessions;
5. deletes the consents of accounts deleted before the cutoff, then the user rows that nothing
   references any more;
6. records a `retention.applied` system event with every count.

There is no in-process scheduler. Run `npm run db:retention` in development, or schedule
`node backend/dist/database/retention.js` in the `api` container, for example daily:

```cron
0 4 * * * docker compose exec -T api node backend/dist/database/retention.js
```

Councils with legal retention duties for fees or archives (for example accounting rules) must set
`retention_months` accordingly or export the affected records before they are detached.

## Audit log

Every write records who acted (`actor_id`, `actor_role` of `citizen`, `manager` or `system`), what
happened (`action`), on which resource and, where useful, `details`: the reservation interval, the
before/after interval of a reschedule, or the changed facility fields (a changed opening calendar is
flagged, not copied). Managers holding `audit:view` read it under **Auditoría** in the backoffice or
at `GET /v2/manager/audit`, filtered by period and action. The log is append-only through the API;
retention only removes the actor link.

## Security measures relevant to the processor contract

- Session tokens are 256 random bits, stored as SHA-256 hashes, HttpOnly and SameSite=Strict, and
  Secure in production. Mutations require a same-origin custom header.
- Tenant isolation is enforced in every repository query and covered by end-to-end tests.
- Reservations, notices and audit events commit in one transaction; a failure rolls them all back.
- No personal data leaves the deployment: no third-party analytics, fonts, maps or AI services.
  The only exception is optional and the council's own: when a manager turns web analytics on,
  page views go to the council's self-hosted Umami. Each view carries the path (without query
  strings or identifiers), the language, the screen size, the browser and the IP address, which
  Umami turns into a daily rotating hash to count unique visitors. It is off by default and must be
  mentioned in the privacy notice; see [analytics](analytics.md).
- Slot suggestions use only aggregated, anonymous occupancy.
  Sign-in happens at the identity provider the operator configures (for example Cl@ve through the
  _deputación_); Quenda only receives the claims listed above.
- The NIF is encrypted with AES-256-GCM and searched by HMAC digest; the key lives outside the
  database (`QUENDA_DATA_KEY`).
- All code and dependencies are free software under licences checked in CI.

## Not covered by the prototype

Real Cl@ve onboarding (the repository simulates it, see [public identity](identity.md)), Chave365, a full export and import of one municipality's data for a change of operator (issue #7), TLS termination, rate limiting, backup and
restore procedures, breach notification workflow, ENS categorisation and a formal data protection
impact assessment are deployment tasks outside this repository's V0. The templates in
[`docs/legal/`](../legal/) leave them as obligations for the processor and the council.
