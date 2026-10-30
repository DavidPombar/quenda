# Slot suggestions and web analytics (#25)

Two optional features from the call's «analítica de uso e recomendación horaria». Neither uses
an AI model, and no personal data goes to a third party (criterion 4).

## Slot suggestions

When the chosen day has no free slot in a facility, or a reservation fails because someone took
the slot first (`slot_taken`), the citizen app shows **«Alternativas con menos ocupación»**: up
to three free slots, least usually occupied first.

**Where alternatives come from**
- **The same local date:** other days are out of scope.
- **The same facility and the municipality's other active facilities of the same sport.** Sports
  come from the catalogue of #26.

**How free slots are found**
- Free slots come from the same `AvailabilityGrid` (`facilities/application/availability-grid.ts`)
  that serves the public availability.
- So a suggestion is always bookable in the same way.

**How they are ordered**
- **Usual occupancy:** for each facility × ISO weekday × local hour, booked over open time over the
  last 12 complete ISO weeks.
- It is computed with `MunicipalityInsights.weekly()`, the same calculation as the manager's
  indicators and the open data. Indicators, open data and suggestions therefore always agree.
- The map is cached in memory per municipality and local day.
- **Ties:** the same facility first, then the time closest to the one wanted.
- **Without history** (a new municipality, or an hour never open), a slot carries
  `occupancyPct: null` and comes after the ones with history, ordered only by closeness to the
  wanted time.
- **One per hour:** a start time appears once per facility, whatever its number of courts.

**Replacing the heuristic.** The ranking lives behind the `Recommender` port
(`insights/domain/slot-recommender.ts`). The default, `HistoricalOccupancyRecommender`, is a
transparent rule with unit tests. An open-weights model running on the council's own server could
implement the same port without touching the API or the app.

**API.** `GET /v2/public/slot-suggestions?slug=&facilityId=&date=&around=`, where `around` is the
wanted start (an ISO instant) and is optional.
- Each item has the facility, the court, `start`, `end`, `occupancyPct` and `sameFacility`.
- Only aggregated data is used.
- A suggestion in another facility opens that facility's page on the same date (`?data=`).

## Web analytics with Umami (optional, per council)

Each council can count visits to the citizen app in **its own** [Umami](https://umami.is)
(MIT, self-hosted, no cookies). It is off by default. A manager turns it on in
**Axustes → Analítica web** with:
- the base URL of the Umami (HTTPS);
- the site id from Umami.

Both are required, or neither. The change is audited like any other setting.

**How a view reaches Umami**
- The app never loads Umami's script and the Content Security Policy does not change.
- On every route change, the app posts `{ slug, path, language, screen }` to our API
  (`POST /v2/public/analytics/pageview`).
- The API passes it to `${analyticsUrl}/api/send`, Umami's own collection endpoint, in the
  background, with a 3-second timeout and no retries. A slow or failing Umami never affects the
  app.
- The endpoint always answers 204, so a page cannot tell whether analytics is on. The public
  municipality only exposes `analytics: true|false`, never the address.

**What is sent**
- **The path:** without query string or fragment, which may carry tokens such as the unsubscribe
  link's, and with UUIDs replaced by `:id`.
- **The language and the screen size.**
- **The visitor's `User-Agent` and IP address** (`X-Forwarded-For`), at the council's request, so
  that Umami can count unique visitors. Umami turns them into a hash with a salt that rotates every
  day and does not store them.
- **No referrer and no cookies.**

The council must say so in its privacy notice before turning analytics on; the admin section
reminds the manager.

**Allowed addresses.** Only HTTPS servers are accepted. Outside production, `http://127.0.0.1`
and `http://localhost` are also accepted, for a local Umami and the e2e tests.

**Local Umami.** `npm run analytics:up` starts Umami at http://127.0.0.1:8095 (user `admin`,
password `umami`) with its own PostgreSQL.
1. Create a website there.
2. Put `http://127.0.0.1:8095` and the website's id in Axustes → Analítica web.

`npm run analytics:down` removes it.
