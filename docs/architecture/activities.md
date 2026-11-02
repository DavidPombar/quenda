# Activities and sports schools (#97)

Councils run swimming courses, sports schools and guided classes alongside court bookings: a
course with places, a weekly schedule and an enrolment period. Small councils usually handle them
with a paper form at the town hall. Quenda models them next to the reservation engine, so an
activity's sessions and a one-off booking never take the same court at the same time (C1, M1, M2).

This is the first of four parts. Part A, described here, publishes the offer and holds the courts.
Enrolment with a waiting list, people in the care of an adult (minors), and attendance with its
indicators follow in later parts.

## Model

- **Activities** (`activities`): facility and court or lane, sport from the municipality's
  catalogue, name and description in Galician and Spanish, places (1–500), optional minimum and
  maximum age, an enrolment period (local dates, closing by the last day) and a status: `draft`,
  `published` or `cancelled`.
- **Weekly rule**: ISO weekdays, local start and end times, first and last day, and dates without a
  session. It is stored as the manager edits it and as the RFC 5545 text it produces (`schedule`: a
  weekly `RRULE` with `UNTIL` and one `EXDATE` per date without a session, with the municipality's
  `TZID`), so open data and exports carry a standard rule.
- **Prices** (`activity_prices`): informative, for the whole activity, like the facility tariffs:
  the general price and one per user category the municipality uses.
- **Sessions** (`activity_sessions`): one row per date, `active` or `cancelled`, with a `sequence`
  that grows on every change (for calendars later). Each active session of a published activity
  occupies its units in `booking_units`, the court itself or every part of a whole court, always
  exclusively, like a club's season slot. A `booking_units` row now belongs to a booking, a season
  occurrence, a waiting-list offer or a session (`booking_units_owner`).

## Sessions

The rule is expanded with the same RFC 5545 engine as opening hours (`OpeningCalendar`) in the
municipality's time zone, so a session keeps its local time across daylight-saving changes. Dates
already past are not created, municipal holidays are skipped when the facility follows them, and at
most 400 sessions are allowed.

**Clashes are not saved** (decision of this issue). A session that falls outside the facility's
opening hours, or on a court already held by a booking, a club, another activity or an open
waiting-list offer, makes the save fail with `409 activity_conflict`. The problem lists the dates
(`clashes: [{ date, start, end, reason }]`, without saying who holds the court), and the backoffice
offers to add each one as a date without a session. The check runs under the facility lock, the
same lock bookings take, and again when a draft is published; the exclusion constraint backs it up.

## Lifecycle

- **Draft** (`POST /v2/manager/activities`): stored only if its sessions fit, but it holds nothing
  and is not public.
- **Publish** (`POST /v2/manager/activities/:id/publication`): checks again, writes the sessions and
  their units, and the activity appears in the catalogue. Requires an active facility.
- **Edit** (`PUT /v2/manager/activities/:id`): a published activity gets new upcoming sessions from
  the new rule. Sessions already held stay as they were. Courts it gives up go to the waiting lists
  of those slots (#96).
- **Cancel a session** (`PATCH /v2/manager/activity-sessions/:id`) or **the whole activity**
  (`PATCH /v2/manager/activities/:id`), with a reason: the court is free again for those times and
  may be offered to the waiting list. Past sessions are kept.
- **Closing the facility** cancels its upcoming sessions with the closure reason; the confirmation
  screen counts them next to the bookings.

Every decision is audited: `activity.created`, `activity.updated`, `activity.published`,
`activity.cancelled`, `activity_session.cancelled` and `facility.activity_sessions_cancelled`.

## Public catalogue

`GET /v2/public/activities?slug=` lists the published activities that have not ended, twelve per
page, filtered by `sport`, `facility`, `age` (activities whose limits include it) and `open=true`
(enrolment open today). `GET /v2/public/activities/:id?slug=` adds the upcoming sessions, cancelled
ones marked with their reason. Drafts are never public. The citizen app shows them at
**Actividades** (`/app/{slug}/actividades`), and each facility page lists its activities.

## Elsewhere

- **Availability**: a slot held by a session is `activity` («Actividade municipal») and cannot be
  booked.
- **Indicators**: active sessions count as occupied time, not as bookings.
- **Open data**: `activities.json` (schema.org `EventSeries` with a weekly `Schedule`) and
  `activities.csv`, in the DCAT catalogue as «Actividades e escolas deportivas». They carry the offer
  only (see [open data](open-data.md)).
- **Portability**: exports include `activities`, `activityPrices` and `activitySessions`; the import
  rebuilds the court units of active sessions (see [data portability](data-portability.md)).
- **Data protection**: part A stores no personal data. Enrolment and minors come with their own
  review of `data-protection.md`.
