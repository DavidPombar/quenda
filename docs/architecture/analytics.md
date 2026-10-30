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

## Web analytics with the deployment's Umami (#57)

The deployment can run its own [Umami](https://umami.is) (MIT, self-hosted, no cookies). It counts
visits to the **citizen app** and the **public website**, one Umami site each. The backoffice is
never counted. Without `UMAMI_URL` nothing is sent and no dashboard appears.

**Who counts what**
- **Citizen app:** only in councils whose manager switched it on in **Axustes → Analítica web**.
  It is off by default, and the change is audited as `municipality.updated`.
- **Public website:** counted whenever the deployment sets `UMAMI_WEB_WEBSITE_ID`, because it
  belongs to no council.
- **Opt-outs:** a browser sending Do Not Track (`DNT: 1`) or Global Privacy Control
  (`Sec-GPC: 1`) is never counted. The app and the website do not even send the request, and the
  API drops it if it arrives.

### Collection
- **Route.** The browser posts `{ app, slug?, path, language, screen, event? }` to our own API
  (`POST /v2/public/analytics/pageview`, always 204). The API passes it to Umami's
  `/api/send` in the background, with a 3-second timeout.
- **No script, no CSP change.** No Umami script is loaded and the Content Security Policy stays as
  it is.
- **What is sent:**
  - the path, without query string or fragment and with UUIDs replaced by `:id`;
  - the language and the screen size;
  - the visitor's `User-Agent` and IP address (`X-Forwarded-For`), which Umami turns into a daily
    rotating hash to count unique visitors;
  - `tag` = the council's slug, for app views;
  - no referrer.
- **Events.** A short, fixed list without properties:
  - app: `search` (catalogue filters), `slot-open` (booking dialog), `booking-confirmed` and
    `suggestion-picked` (the alternatives of #25);
  - website: `search`.

  Anything else is rejected.

### Dashboards
The API reads Umami's REST API with a **read-only user** (`view-only` role, `team-view-only` in
the «Quenda» team that owns both websites). The token is kept in memory and renewed once on 401.
Credentials never reach the browser, and the dashboards are Quenda's own components, accessible
and in Galician and Spanish.

- **Operator** (`GET /v2/operator/web-analytics`, **Analítica web** in the operator area). It
  shows:
  - app and website totals: visitors, visits, page views, bounce rate and average visit length;
  - the most viewed pages, referrers, devices, languages and events;
  - a table of visitors, visits and page views for each council with analytics on.
- **Manager** (`GET /v2/manager/web-analytics`, section **Visitas á app** in **Indicadores**).
  The same report, only for their council's app (`tag` = slug), for the period chosen on that
  page.

**Ranges.** Ranges are local dates: the council's time zone for managers and
`DEPLOYMENT_TIMEZONE` (default `Europe/Madrid`) for the operator. They can span at most 16 months,
and the default is the last 7 days.

**When the dashboards say nothing.** Umami is not called when the deployment cannot read it
(`available: false`) or the council has analytics off (`enabled: false`). If Umami is down, the
dashboards answer `503 analytics_unavailable`.

Checked against Umami v2.20.2:
- totals come as `{ value, prev }`;
- pages are the `url` metric;
- `tag` filters totals;
- there is no per-tag breakdown, so the operator's table makes one totals request per council.

### Configuration
| Variable | Meaning |
| --- | --- |
| `UMAMI_URL` | Base URL. HTTPS, or HTTP to `127.0.0.1`/`localhost` outside production, or any HTTP address with `DEMO_MODE=true` (the demo's `http://umami:3000`). |
| `UMAMI_APP_WEBSITE_ID` | Umami website of the citizen app; without it nothing is counted. |
| `UMAMI_WEB_WEBSITE_ID` | Umami website of the public website; optional. |
| `UMAMI_USERNAME`, `UMAMI_PASSWORD` | Read-only user for the dashboards; without them there are no dashboards. |
| `DEPLOYMENT_TIMEZONE` | Time zone of the operator's ranges (default `Europe/Madrid`). |

**Local Umami**
1. `npm run analytics:up` starts Umami (`ghcr.io/umami-software/umami:postgresql-v2.20.2`) at
   http://127.0.0.1:8095, with its own `umami` database in the existing Postgres.
2. `npm run analytics:setup` signs in as the administrator (default `admin`/`umami`; change it in
   any shared install). It creates the «Quenda» team, the two websites and the read-only user,
   and prints the variables for `.env`. It reuses what already exists.
3. `npm run analytics:down` removes the container.

In the Compose demo, set `UMAMI_URL=http://umami:3000` with the IDs and the user printed by the
setup.
