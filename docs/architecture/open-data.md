# Open data (T3, criterion 4)

Each municipality publishes its sports facility catalogue and its aggregated occupancy as open
data, with a DCAT description so that national and regional portals can harvest it. This addresses the «estándares abertos»
requirement (T3) and the open formats and data portability parts of criterion 4. The files contain
no personal data: no people, no individual reservations.

## Endpoints

All endpoints are public `GET` routes under `/v2/public/open-data/` and take the municipality as
`?slug=`. They are documented in OpenAPI (`/api/docs`, tag `public/open-data`).

| File                 | Media type             | Content                                                                                                                | Schema                                                            |
| -------------------- | ---------------------- | ---------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| `facilities.json`    | `application/ld+json`  | schema.org `ItemList` of `SportsActivityLocation` (or `TennisComplex`, `PublicSwimmingPool`)                           | `schemas/facilities.schema.json` (JSON Schema 2020-12)            |
| `facilities.csv`     | `text/csv`             | One row per facility: RFC 4180, UTF-8 without BOM, comma, CRLF, decimal point, snake_case headers                      | `schemas/facilities.tableschema.json` (Frictionless Table Schema) |
| `facilities.geojson` | `application/geo+json` | RFC 7946 `FeatureCollection` of `Point [longitude, latitude]`; `geometry` is `null` when a facility has no coordinates | `schemas/facilities.geojson.schema.json`                          |
| `occupancy.json`     | `application/json`     | Aggregated occupancy, one item per facility × ISO week × weekday × local hour with open time (see below)               | `schemas/occupancy.schema.json`                                   |
| `occupancy.csv`      | `text/csv`             | The same cells as RFC 4180 CSV, like `facilities.csv`                                                                  | `schemas/occupancy.tableschema.json`                              |
| `catalog.rdf`        | `application/rdf+xml`  | DCAT-AP-ES (NTI-RISP) catalogue, for the datos.gob.es federation                                                       | —                                                                 |
| `catalog.jsonld`     | `application/ld+json`  | The same catalogue as JSON-LD, for CKAN harvesters such as abertos.xunta.gal                                           | —                                                                 |

The schemas themselves are served at `/v2/public/open-data/schemas/{name}` and need no slug.

Every response carries `Cache-Control: public, max-age=300`, `Access-Control-Allow-Origin: *` and
`Cross-Origin-Resource-Policy: cross-origin`. These override the API's default `no-store` and
helmet's same-origin resource policy, so any site or tool can reuse the files. No cookie is read
or set.

Absolute URLs (facility pages, distributions, the catalogue) use `PUBLIC_URL` when it is set. A
production deployment must set it; otherwise the origin of the request is used, which is fine for
local development behind the Vite proxy.

The citizen app shows the downloads, the licence and the catalogue at **Datos abertos**
(`/app/{slug}/datos-abertos`), linked from the help area of every page.

## Fields

The CSV columns and the GeoJSON properties are the same record:

| Column                    | Meaning                                                                            |
| ------------------------- | ---------------------------------------------------------------------------------- |
| `id`                      | Facility UUID, stable across publications                                          |
| `name`, `address`         | As shown in the citizen app                                                        |
| `sport`                   | Quenda sport code (`padel`, `tennis`, `futsal`, `swimming`)                        |
| `cnid_class`, `cnid_type` | CNID classification (see below)                                                    |
| `schema_type`             | schema.org type used in the JSON-LD                                                |
| `latitude`, `longitude`   | WGS 84, decimal degrees; empty when unknown                                        |
| `accessible`              | Step-free access                                                                   |
| `status`                  | `active`, `maintenance` or `closed`; closed facilities are still listed            |
| `slot_minutes`            | Length of one bookable slot                                                        |
| `price_eur`               | Indicative price per slot; payment is outside V0                                   |
| `courts`                  | Active courts or spaces; the parts of a divisible court are not counted separately |
| `url`                     | Public page of the facility in the citizen app                                     |

Managers enter the coordinates in the facility editor of the backoffice. They are optional, and
latitude and longitude must be set together.

## Taxonomy: CNID and schema.org

The CSD's Censo Nacional de Instalaciones Deportivas (CNID, 2005) has no published data schema or
codes; its interpretation manual groups conventional sports spaces (pistas, pabellones, vasos de
piscina, campos…) and names space types. Quenda maps each sport to a CNID group and type name, and
to the most specific schema.org type. Since #26 the classification lives in each municipality's
sports catalogue (`sports` table); the initial catalogue, from migration `0014`, starts with:

| Sport      | CNID group       | CNID type                | schema.org               |
| ---------- | ---------------- | ------------------------ | ------------------------ |
| `padel`    | Pistas           | Pista de pádel           | `SportsActivityLocation` |
| `tennis`   | Pistas           | Pista de tenis           | `TennisComplex`          |
| `futsal`   | Pabellones       | Pabellón polideportivo   | `SportsActivityLocation` |
| `swimming` | Vasos de piscina | Vaso de piscina cubierta | `PublicSwimmingPool`     |

The initial catalogue also includes basketball, handball, volleyball, football, athletics, fronton,
squash and gym, hidden until a council shows them. Managers can add sports with their own CNID group
and type. The names should be checked against the census manual before a council publishes the
catalogue. The `sport` field of the published files is a code from that catalogue (see
[facility catalogue](catalogue.md)).

## Aggregated occupancy

Following the Münster and Paris open data, `occupancy.json` and `occupancy.csv` publish how the
facilities are used, as decided in #21: one cell per facility × ISO 8601 week × ISO weekday ×
local hour (municipality time zone), with no minimum threshold. Each cell has:

| Column                                        | Meaning                                                                         |
| --------------------------------------------- | ------------------------------------------------------------------------------- |
| `facility_id`, `facility_name`, `sport`       | The facility, as in `facilities.csv`                                            |
| `iso_year`, `iso_week`, `week_start`          | ISO week-numbering year and week, and its Monday                                |
| `weekday`, `hour`                             | ISO weekday (1 = Monday) and local hour 0–23                                    |
| `open_minutes`                                | Open time in that hour, times the active courts                                 |
| `booked_minutes`                              | Open time held by confirmed bookings (attended or upcoming)                     |
| `no_show_minutes`                             | Open time held by bookings marked as no-shows: booked but not used              |
| `occupancy_pct`                               | `booked_minutes` over `open_minutes`, rounded percent                           |

Only cells with open time are listed, so a missing hour means "closed", not "0 %". Open time is
the opening calendar while the facility was active, minus the municipal holidays it follows. The
calculation is the one behind the manager's indicators (`insights/domain/occupancy.ts`), so both
always agree. Cancelled bookings are not counted.

Without parameters, the files cover the last 12 complete ISO weeks (Monday to the last Sunday).
`from` and `to` (local dates, `YYYY-MM-DD`, both required) select another range of at most
16 months; future dates show bookings already made. No booking, person or court identifier is
published.

## Licence and publisher

Each municipality has `data_license` (`CC-BY-4.0` by default; also `CC-BY-SA-4.0`, `CC0-1.0`,
`ODbL-1.0`) and an optional `dir3_code`. The licence appears in every file and in the catalogue.
With a DIR3 code, the DCAT publisher is the datos.gob.es organisation URI
(`http://datos.gob.es/recurso/sector-publico/org/Organismo/{DIR3}`); without it, a `foaf:Agent`
with the council's name. Managers edit both in **Axustes → Datos abertos** of the backoffice
(`PATCH /v2/manager/municipality` with `dataLicense` and `dir3Code`; an empty or null code
removes it), and the change is audited like any other setting.

## DCAT-AP-ES

The catalogue (`dcat:Catalog`) describes two datasets, «Instalacións deportivas» and «Ocupación
das instalacións deportivas» (its distributions cover the default 12 weeks), each with:

- title and description in Galician and Spanish;
- keywords, the NTI-RISP theme `http://datos.gob.es/kos/sector-publico/sector/deporte`, the
  languages `gl` and `es`, the modification date (the day of generation, in the municipality's
  time zone), the licence and the landing page;
- one distribution per format, with access and download URL, media type, `dct:format` as
  `dct:IMT`, licence and `dct:conformsTo` pointing at its schema.

Both serialisations come from one in-memory model, and the tests check that they list the same
distributions and that every distribution downloads.

**Registering the catalogue.** In datos.gob.es, the council (or its _deputación_) registers as a
publishing body and adds `catalog.rdf?slug=…` as a federated catalogue. Validate it first with the
portal's federation validator. In abertos.xunta.gal (CKAN), the harvester points at
`catalog.jsonld?slug=…` or `catalog.rdf?slug=…`. Spatial coverage (`dct:spatial`) and the date of
first publication (`dct:issued`) are not generated, because Quenda does not store the council's
territorial code or publication history. Add them when registering if the portal requires them.

## Validation

- Unit tests (`backend/src/v2/modules/open-data/infrastructure/formats/open-data-formats.spec.ts`)
  validate the JSON-LD and the GeoJSON with **Ajv** (JSON Schema 2020-12). They also cover CSV
  quoting, the `[longitude, latitude]` order and XML escaping.
- HTTP tests (`backend/test/open-data.e2e-spec.ts`) fetch every file through the API and check:
  - each file against the schemas the API itself serves;
  - the CSV header and types against the Table Schema;
  - the headers, municipality isolation and the licence change;
  - the DCAT properties and the OpenAPI document.
- The browser smoke opens **Datos abertos**, runs an axe scan and downloads the GeoJSON.

There is no automatic check against the official DCAT-AP SHACL shapes; that needs an RDF toolchain
the project does not depend on. Use the datos.gob.es validator when registering.

## Not covered yet

- **Roadmap: OpenActive (RPDE).** OpenActive is the only open European standard for live sports
  availability. More than 4,000 UK providers publish it, and Sport England requires it from
  facilities it funds. A feed would publish `FacilityUse` and `Slot` items through the Realtime
  Paged Data Exchange (RPDE), using the data Quenda already holds: resources, opening calendars and
  `booking_units`. Booking through the Open Booking API would be a later step. It is left to the
  roadmap of the technical memory, because no Spanish or Galician aggregator consumes it today.
