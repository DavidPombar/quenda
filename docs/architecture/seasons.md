# Season allocation to clubs (#17)

Councils give clubs, schools and associations recurring weekly slots for a season. In Galicia this
is still done by hand (bases, decrees, spreadsheets); across Europe it is the core of municipal
sports booking. Quenda models it directly, linked to the reservation engine, so a club's slot and a
citizen's one-off booking can never overlap.

## Model

- **Organizations** (`organizations`): registered by the manager with a name and, optionally, a tax
  id (CIF), main sport and contact address. An archived club keeps its history but gets no new
  slots.
- **Representatives**: existing citizen accounts of the municipality, linked by their email address
  (`users.organization_id`). A club may have several representatives; a person represents at most
  one club. Representatives see their club's upcoming slots under **A miña conta → O meu club**.
  Season slots are not personal bookings and never use their quota.
- **Campaigns** (`season_campaigns`): a name, first and last day (a school year, a calendar year, a
  summer…), the facilities they cover and the priority criteria, published as text in Galician and
  Spanish (`GET /v2/public/season-campaigns?slug=`, shown on each facility page). Several campaigns
  may share a facility, for different sports or profiles.
- **Allocations** (`season_allocations`): a club, a facility and court, ISO weekdays and local start
  and end times, plus the reason for the decision. The export carries the equivalent RFC 5545 rule
  (`FREQ=WEEKLY;BYDAY=…;UNTIL=…`) for other systems.
- **Occurrences** (`season_occurrences`): one row per date, `active`, `conflict` or `cancelled`.
  Each active occurrence occupies its units in `booking_units` — the court itself, or every part of
  a whole court — so the existing `booking_units_no_overlap` exclusion constraint keeps club slots
  and one-off bookings apart in the database. Each `booking_units` row now belongs to either a
  booking or an occurrence.

## Decisions

Clubs do not apply in this phase: the manager builds the final schedule (`POST
/v2/manager/season-allocations`). The command locks the facility, the same lock one-off bookings
take, expands the dates between the campaign's days in the municipality's time zone (a local time
that does not exist on a daylight-saving change is skipped; dates already past are not created) and
stores each one. A date whose court is already taken by a one-off booking or another club is kept
as a **conflict** — the existing booking stays — and the response lists those dates for the
manager. Municipal holidays do not cancel season slots.

The manager can free a single date (`PATCH /v2/manager/season-occurrences/:id`) or withdraw the
whole slot (`PATCH /v2/manager/season-allocations/:id`); dates that have not started become
bookable again. Every decision is audited with who, when and why: `organization.created/updated`,
`organization.representative_added/removed`, `season_campaign.created/updated`,
`season_allocation.created` (reason, dates and conflicts), `season_allocation.cancelled` and
`season_occurrence.cancelled`.

## Elsewhere

- **Availability**: a slot held by a club is `season` («Uso de club») rather than `booked`.
- **Indicators**: active occurrences count as occupied time, not as bookings.
- **Portability**: exports include `organizations`, `seasonCampaigns`, `seasonAllocations` and
  `seasonOccurrences`; the import rebuilds their court units (see [data portability](data-portability.md)).
- **Data protection**: club data is not personal data; the only personal link is the representative
  account, cleared when that account is deleted.

Not in this phase: applications and scoring by clubs, carrying a season over from the previous one,
email notices to clubs, QR passes and door webhooks for club slots, and mandatory eID for
representatives.
