# Opening calendars (C1, C2, M2, T3)

`facilities.opening_calendar` is the original RFC 5545 iCalendar string. There is no weekly-hours JSON schema. The weekly form is an editing convenience that serializes a normal calendar; importing or editing a source keeps it as `.ics` text. API availability slots are temporary read projections after subtracting reservations and past times, not the source of opening hours.

Each master VEVENT describes an opening interval. Multiple events represent split shifts. RRULE defines recurrence; EXDATE removes occurrences; RDATE adds occurrences; a VEVENT with the same UID and RECURRENCE-ID replaces an individual occurrence. A cancelled exception removes it. Overlapping opening intervals are merged. The slot duration is a separate booking rule, not a calendar format.

The supported V0 profile is intentionally bounded: 1–64 timed events, a maximum 64 KiB source, starts in 2000–2100, positive durations up to 48 hours, and DAILY/WEEKLY/MONTHLY/YEARLY recurrence. The engine caps expansion at 32,000 occurrences per event. Hour/minute/second frequency selectors, all-day events and RANGE=THISANDFUTURE are rejected. UID, DTSTART and DTEND or DURATION are required. Events use the municipality's IANA zone or UTC; floating times use the municipality's zone. Embedded custom VTIMEZONE definitions are not interpreted; use IANA zone IDs. This is not a claim of support for every RFC 5545 feature.

ICAL.js parses and expands the recurrence set. The adapter maps wall-clock fields to Temporal.ZonedDateTime in the configured IANA zone, then to Temporal.Instant. It does not use ICAL's unknown-zone-to-UTC fallback. Daily/weekly local times therefore remain local across DST. Nonexistent local occurrences during a spring DST gap are skipped rather than shifted. V0 also rejects ambiguous wall-clock times during a DST fold; use explicit UTC events if that hour must be reservable.

Only complete slots fit inside an opening. Overnight openings can contribute to the following local date. Reservation starts must align to the opening's slot grid and fit wholly inside it. The server checks this again inside the reservation transaction. Past instants, dates beyond the municipality's horizon, unavailable facility states, conflicting reservations and person-level quota violations are rejected.

A manager cannot change the calendar, slot duration or facility state while confirmed future reservations exist (409 `calendar_in_use`). Other metadata remains editable. This prevents silent invalidation; conflict resolution and bulk cancellation with notices can be a subsequent feature.

References: [RFC 5545](https://www.rfc-editor.org/rfc/rfc5545), [ICAL.js event API](https://kewisch.github.io/ical.js/api/ICAL.Event.html), [Temporal polyfill](https://github.com/js-temporal/temporal-polyfill).

## Personal calendars (optional "calendarios persoais", T3)

Bookings are also published as RFC 5545, in the opposite direction: from Quenda to the
person's calendar app.

- `GET /v2/citizen/bookings/:id/calendar.ics` downloads one reservation with the session cookie.
- `POST /v2/citizen/calendar-feed` issues a subscription link and returns its secret path once;
  issuing again replaces the previous link. `DELETE` revokes it and `GET` reports only whether a
  link exists. Only a SHA-256 hash of the 256-bit token is stored (`calendar_feeds`).
- `GET /v2/public/calendar-feeds/:token.ics` needs no cookie, because calendar clients cannot send
  one. It lists the person's bookings that ended less than 30 days ago or are still to come.
- Each booking is one `VEVENT` with `UID:<booking-id>@quenda`. `bookings.sequence` increments on
  every reschedule or cancellation and is published as `SEQUENCE`; cancellations stay in the feed
  with `STATUS:CANCELLED`, so subscribed clients update the event instead of duplicating it.
- Times are UTC instants, so no `VTIMEZONE` is needed. The feed carries the facility name and
  address and the municipality name, never the person's name or other personal data.
