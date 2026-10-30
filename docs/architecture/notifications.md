# Notices: in-app, email and Web Push (C4, #12, #35)

Every change to a reservation creates an **in-app notice** (`notifications`), the person's
history (C4). It is always kept. The person also chooses, per kind of notice, whether it reaches
them **by email** and **on their devices** (Web Push). SMS is out of scope.

## Kinds and defaults

| Notice (`notification_preferences.kind`) | Outbox message kinds                      | Email | Push |
| ---------------------------------------- | ----------------------------------------- | ----- | ---- |
| `confirmation`                           | `confirmed`                               | on    | on   |
| `change`                                 | `rescheduled`                             | on    | on   |
| `cancellation`                           | `cancelled`, `cancelled_by_municipality`  | on    | on   |
| `reminder`                               | `reminder`                                | on    | on   |
| `penalty`                                | `no_show`, `blocked`, `unblocked` (#16)   | off   | off  |

The defaults live in one place, `backend/src/v2/shared/application/notice-preferences.ts`. A
missing row means the default, so existing accounts keep receiving what they received before.
Push is "on" by default, but it only reaches people who turned notices on in at least one browser.
Email needs an address on the account.

People choose under **Conta e privacidade → Avisos**. The API is
`GET`/`PUT /v2/citizen/me/notification-preferences`, which reads or replaces the whole matrix.
Only the choices that change are written and audited (`notification_preferences.updated`, with
the changed `kind.channel` pairs).

## How the outbox applies the choice

`queueBookingChange` queues `email` and `push` for every change, plus the access-control `webhook`
when the change affects the door. The `PostgresOutbox` adapter only inserts a row when it applies:

- **email** and **push**: the stored choice, or the default.
- **push** also needs at least one device.
- **webhook**: the municipality has a connector ([QR access](access-control.md)).

The worker checks the choice again when it leases the row. A notice switched off after it was
queued is closed without sending (`last_error = 'skipped:preference'`).

`ScheduleReminders` first adds the in-app reminder, which carries a unique
`notifications.dedupe_key` (`reminder:{booking}:{start}`), and then queues the channels the same
way. Reminders therefore reach the app history even when no channel is on, and a repeated pass
adds nothing. Reminders queued before the key moved to `notifications` are still recognised by
their outbox key.

## Email unsubscribe links

Every email carries a signed link and a `List-Unsubscribe` header. The link switches **that
kind** of notice off by email without signing in: the app page `/app/{slug}/baixa?token=…` asks
for a click, then calls `POST /v2/public/unsubscribe`. That way mail scanners that follow links
change nothing.

The token (HMAC with `UNSUBSCRIBE_SECRET`) names the municipality, the person, the notice kind
and the version of that choice: the time it last changed, or `0`. It works once in practice:
- repeating it after the notice is off does nothing;
- once the person changes that choice again, the token answers `410 unsubscribe_stale`. So an old
  email cannot switch off a notice the person turned back on.

Reminder links sent before versions existed are still accepted. Each use is audited as
`notification_preferences.unsubscribed`.

## Web Push

Push is standard Web Push and needs no proprietary SDK:
- VAPID authentication (RFC 8292);
- payload encryption (RFC 8291) through the `web-push` library (MPL-2.0), with the request sent
  by `fetch`.

**The browser side.** The citizen app registers `frontend/app/public/sw.js` (scope `/app/`) only
when the person presses **Activar avisos neste dispositivo**. The browser asks for permission then
and never before. The app sends the `PushSubscription` to
`POST /v2/citizen/me/push-subscriptions`. **Desactivar neste dispositivo** unsubscribes and calls
`DELETE` with the endpoint. A person can have several devices (`push_subscriptions`, unique per
municipality and endpoint).

The page explains why push may be unavailable:
- the browser has no support;
- the browser blocked notices;
- the device is an iPhone or iPad and the app is not on the home screen (iOS 16.4 or later);
- the deployment has no VAPID keys.

**The server side.** The worker sends each push message to every device of the person:
- **Retries:** the `Topic` header is a hash of the outbox id, so a retried message replaces a
  pending copy instead of showing twice. TTL is 24 hours.
- **Gone devices:** a device whose push service answers 404 or 410 is deleted.
- **Failures:** the message is retried, with the outbox backoff, only when no device received it
  and one failed for another reason.

Only HTTPS push services are called. The e2e tests use a loopback HTTP service, allowed only when
`NODE_ENV=test`.

**What a push notice says.** The payload names only the municipality and the kind of event
(«Tes un cambio nunha reserva»), never the person, the place or the time, because lock screens
are visible to others. Tapping it opens `/app/{slug}/reservas`, and the service worker only opens
pages of its own origin.

**Configuration.** `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY` and `VAPID_SUBJECT` (a `mailto:` or
`https:` contact). The API and the worker must share the pair: generate one with
`npx web-push generate-vapid-keys`. Changing the pair invalidates every device: people have to turn
notices on again. Without keys, push is unavailable (`push.available = false`), except with
`DEMO_MODE=true`, which uses a public demo pair committed in the code.

## Privacy

Preferences and devices are part of the account export (`preferences`, `pushDevices`). Devices
are exported only with the origin of their push service, browser and date. The endpoint and its
keys are credentials and are not exported, not even in the municipal portability export. Both
are deleted with the account. See [data protection](data-protection.md).
