# Facility catalogue (#26)

Requirement C1 («consulta de instalacións») and M1. The catalogue is filtered and paginated on
the server, each municipality keeps its own sports catalogue, and the facility page shows
photos, a map and the opening hours of the coming week.

## Server filters and pagination

- `GET /v2/public/facilities?slug=` takes `q` (name or address), `sport`, `accessible`,
  `hideClosed`, `page` and `pageSize` (1–50, default 12). It returns
  `{ items, total, page, pageSize }`.
- Facilities are ordered active first, then in maintenance, then closed, by name within each
  group. Closed facilities stay in the list, marked, unless `hideClosed=true`.
- `GET /v2/public/catalog` (the cross-municipality search of #18) uses the same filters and pages
  instead of the old fixed limit of 200.
- `GET /v2/public/facilities/:id?slug=` is the facility page. The backoffice reads every facility
  with `GET /v2/manager/facilities`.
- The citizen app keeps the filters in the address (`q`, `sport`, `accesible`,
  `ocultarPechadas`, `paxina`), so a search can be shared and the back button works. Pages are
  numbered links with `aria-current`, and the count is announced in a `status` region.

## Sports catalogue

Migration `0014` replaces the fixed `CHECK` of four sports with a `sports` table per municipality:
code, names in Galician and Spanish, CNID group and type, schema.org type, a hidden flag and an
order. Facilities and clubs reference it through `(tenant_id, sport)` foreign keys.

Every municipality starts from the same CNID-based list. The four sports of V0 are visible;
basketball, handball, volleyball, badminton, football, 7-a-side football, athletics, fronton,
squash, gym and the multi-sport court start hidden. A
trigger adds the list to new municipalities, and existing ones received it in the migration.

Managers rename, hide, reorder, add and remove sports in **Axustes → Deportes**
(`GET|POST /v2/manager/sports`, `PATCH|DELETE /v2/manager/sports/:code`). Each change is recorded in
the audit log as `sport.created`, `sport.updated` or `sport.removed`.

- **Names** are unique in each language (`409 sport_exists`).
- **At least one** sport stays visible.
- **Illustration:** each sport chooses the illustration and colour of its facilities (`art`: pádel,
  tennis, futsal, swimming or generic). The API returns it as `sportArt` with facilities, the
  catalogue and bookings, so the frontends never depend on a sport's code.
- **Removal:** only a sport that no facility or club uses can be removed (`409 sport_in_use`); one
  in use can be hidden.
- **Filters:** `GET /v2/public/sports` offers only visible sports that at least one facility has,
  so a small municipality does not show a filter that leads to no results.
- **Booking history** carries the sport's name in both languages.

A hidden sport is no longer offered in filters and is refused for a new or changed facility or club
(`400`), but those that already use it keep it. Open data takes the CNID and schema.org classification from this table
(see [open data](open-data.md)).

## Photos

- Up to ten photos per facility, PNG, JPEG or WebP, 4 MB each, stored in Postgres like the
  municipal logo, so backups and exports carry them.
- The alternative text in Galician is required (T5); the Spanish one falls back to it when
  empty.
- **Upload:** `POST /v2/manager/facilities/:id/photos?altGl=&altEs=` with the image as the raw
  body. The type is checked by its signature (SVG is refused), and the facility lock keeps the
  limit under concurrent uploads.
- **Edit:** `PATCH` and `DELETE …/photos/:photoId` change the alternative text and order, or
  remove the photo. Each change is audited as `facility.photo_added`, `photo_updated` or
  `photo_removed`.
- **Serving:** photos are served from `GET /v2/public/facilities/:id/photos/:photoId?v=<hash>`
  with a one-year `immutable` cache. A new photo gets a new URL.
- **Proxy limit:** nginx allows 5 MB only on the upload path.

## Map

- The facility page shows a Leaflet map (BSD-2-Clause) with a marker when the facility has
  coordinates, next to the address and an «Abrir no OpenStreetMap» link.
- The address is the text alternative. The map does not grab the scroll wheel and can be used
  with the keyboard.
- **Tile server:** set per deployment. The API reads `MAP_TILE_URL` and `MAP_ATTRIBUTION` and
  publishes them at `GET /v2/public/map`. The web image adds `MAP_TILE_ORIGIN` to the CSP
  `img-src`, rendered by the nginx image's templates.
- **Privacy:** the demo uses OpenStreetMap's servers. Each visitor's IP address and user agent
  reach the tile server when the map loads, as the privacy notice must say. A council can point
  `MAP_TILE_URL` at its own or the provincial council's tile server instead.

## Opening hours

The facility page lists the next seven local days. They are expanded from the facility's
RFC 5545 calendar, so recurrence exceptions apply. Days closed by the municipal holiday calendar
show «Pechado (festivo)».

When a facility is closed or in maintenance, the page explains that it cannot be booked instead
of listing slots.
