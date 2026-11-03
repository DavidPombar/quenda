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

### People in an adult's care (#97)

Children's courses are part of the same public service, so enrolling a minor also rests on art.
6.1.e GDPR, not on consent. The adult acts as the child's representative (art. 7 LOPDGDD: under
14, the person holding parental authority or guardianship):

- **Declaration.** Adding a person to their care, the adult declares that they hold parental
  authority or guardianship and act on the child's behalf. The text is shown in the app; the
  record keeps its version (`declaration_version`) and time (`declared_at`), and the action is
  audited as `dependant.added`, without the name.
- **Minimisation.** Only the first name and the year of birth are kept: enough to tell children
  apart and to check an activity's ages (counted in the year it starts). No surname, exact date,
  document or health data.
- **Who sees it.** The adult, in their account. The council sees the first name and age next to
  the adult's name and email in the activity's list and CSV, and the gate shows the first name for
  the roll call. Notices go to the adult; push and calendar subscriptions never carry the name.
- **Rights.** The adult exercises them: they correct or remove the person in their care (refused
  while enrolled; they leave first), and the account export includes them.
- **Retention.** Removed with the adult's account (their places pass to the next person waiting);
  enrolments end with the activity's history after `retention_months` and keep no name once the
  person is removed.

The council's privacy notice must say this; the demo text includes a paragraph to adapt, and the
council's data protection officer should review it.

## Data inventory

| Table                      | Personal data                                                                                                                                                                                                                  | Purpose                                                                                                                     | Retention                                                                                             |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `users`                    | `display_name`, `role`, `assurance`, `deleted_at`, `locale`; `email` when the identity provider sends it (demo citizens get a synthetic one); `nif_ciphertext` and `nif_digest` only when the municipality enables `store_nif`; `organization_id` when the person represents a club (#17) | Identify the person who books or manages; address and language for email notices; the NIF verifies residence for fees (#13) | Name, email, language, NIF and club link erased on deletion; row removed by retention once nothing references it |
| `identities`               | Identity provider issuer and subject identifier                                                                                                                                                                                | Recognise the person at the next sign-in                                                                                    | Deleted with the account                                                                              |
| `login_attempts`           | No personal data: hashed state, nonce, PKCE verifier, notice version                                                                                                                                                           | Complete an OIDC sign-in safely                                                                                             | Ten minutes; expired rows purged by retention                                                         |
| `sessions`                 | Hash of a random token, expiry                                                                                                                                                                                                 | Keep the person signed in for at most eight hours                                                                           | Removed at sign-out, deletion or expiry (retention purges expired rows)                               |
| `consents`                 | Accepted notice version and time                                                                                                                                                                                               | Prove the person was informed                                                                                               | Kept while the account exists; removed by retention after deletion                                    |
| `bookings`                 | Link from a reservation to `user_id`                                                                                                                                                                                           | Provide the reservation and its history                                                                                     | Link set to NULL once the reservation ended more than `retention_months` ago                          |
| `notifications`            | Link to `user_id` and a reservation, a waiting-list entry or an enrolment                                                                                                                                                      | In-app notices                                                                                                              | Deleted on account deletion or after `retention_months`                                               |
| `outbox`                   | Link to `user_id`, a reservation, notice kind and delivery state; never the address or the text                                                                                                                                | Deliver email notices after the reservation commits                                                                         | Deleted on account deletion or after `retention_months`                                               |
| `credentials`, `login_tickets` | Staff login, scrypt password hash, encrypted second-factor secret, failed attempts and lock, disabled date; open sign-in steps (hashed ticket) | Secure sign-in of the people who run the service (T4) | Kept while the person works for the service; disabled accounts stay for the audit trail; tickets removed ten minutes after they expire |
| `login_codes` | Address (SHA-256) and, only until the mail is sent, the address and the code in clear; hashed code, attempts and times | Sign in with a one-time code (#8) | Address and code cleared once sent; row removed a day after it expires, or with the account |
| `waitlist_entries` | Link to `user_id`, the slot of the court waited for, the place in the queue (join time), the offer's times and the booking that took it (#96) | Offer a freed place to the people who asked for it | Deleted when the slot ends (worker on every pass, and retention as a backstop) and on account deletion; `waitlist_outcomes` keeps only daily counts per facility without people |
| `activity_enrolments` | Link to `user_id`, the activity, status, enrolment and end times, and the reason when the council removed the person (#97) | Give places in activities and run their waiting lists; the council sees the person's name and email in the list and the CSV | Deleted, with its notices, once the activity ended more than `retention_months` ago; open enrolments end on account deletion and the place goes to the next person |
| `dependants` | Adult (`user_id`), first name, year of birth, guardianship declaration version and time (#97) | Enrol children and other people in the adult's care in activities for their age | Deleted by the adult or with their account; past enrolments then keep no name |
| `activity_attendance` | Session, enrolment, present or absent, time and the staff member who marked it (#97) | Know who attended a session and the attendance rate of each activity (M3); no penalty | Deleted with its enrolment, after the activity's `retention_months` |
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
about minors beyond the first name and year of birth of a person in an adult's care (#97, see
above). It keeps the identifier the identity provider returns and the name it supplies; the
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

### Data kept on the device (#24)

The installed citizen app keeps a copy of the person's own bookings, notices, penalty standing and
access passes in the browser's storage, so they can be read without a network. The copy expires
after 7 days. It is deleted on sign-out and on account deletion.

The backoffice keeps only the session and the list of councils, besides the door day described
above, which is deleted on sign-out.

The service workers store the application's own files and never API answers. See
[installable app](pwa.md).

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
| Access and portability (arts. 15, 20)    | **A miña conta → Descargar os meus datos** calls `GET /v2/citizen/me/export`: a JSON attachment with profile (including the email address, language and decrypted NIF when stored), linked identities, consents, user categories and the family-tariff choice, every reservation, every notice, the waiting lists of slots still to come (#96), enrolments in activities and the people in the adult's care (#97), notice preferences, the devices receiving push notices (push service, browser and date; not the endpoint or keys), the messages queued or sent by email, push or webhook (kind and dates, no text) and the person's own audit events, without the paging limits of the history views. Audited as `account.exported`.                                                                                |
| Erasure (art. 17)                        | **A miña conta → Eliminar a conta** calls `DELETE /v2/citizen/me`. In one transaction: future confirmed reservations are cancelled regardless of the notice period, notices, queued messages, categories, waiting-list entries, notice preferences and push devices are deleted (a place held for the person goes to the next one waiting), open enrolments of the adult and of the people in their care end and those people are deleted, the email address, language and NIF are cleared, linked identities are deleted, every session is revoked, `display_name` becomes «Conta eliminada» and `deleted_at` is set. Past reservations keep their anonymised row so indicators stay correct. Audited as `account.deleted` with the counts. |
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
2. deletes notices and outbox messages created before the cutoff, and the waiting-list entries of
   slots that have ended (the worker already does it on every pass);
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
  The only exception is optional and stays inside the deployment: its own self-hosted Umami
  (no cookies). It counts the public website, and the citizen app only in councils that switched
  it on (off by default). Each view carries:
  - the path, without query strings or identifiers;
  - the language and the screen size;
  - the browser and the IP address, which Umami turns into a daily rotating hash to count unique
    visitors;
  - for the app, the council's slug.

  Do Not Track and Global Privacy Control are honoured. Managers and the operator only see
  aggregates. The council's privacy notice must mention it; see [analytics](analytics.md).
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
