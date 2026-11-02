# Waiting list for full slots (#96)

A slot that is full today may free up tomorrow, and until now only whoever looked again in time
could take it. The bases call this «baixa visibilidade da dispoñibilidade real». With the waiting
list, a person joins a full slot; when a place frees, it is held for the first person in the queue,
who is told and decides. Nobody is booked automatically: confirming is an ordinary booking, so the
person's rules and tariff apply at that moment (C2, C3, C4, M2, M3).

Waiting lists for club seasons and activities are out of scope (#97).

## Joining

`POST /v2/citizen/waitlist` with `{id, facilityId, resourceId?, start}`, idempotent by `id` like
bookings. Only someone who could book the slot now may wait for it:

- within the advance window and the opening hours (`BookingPolicy`);
- not blocked for no-shows, and below `max_active_bookings`;
- below the council's `waitlist_max_entries` open entries (`422 waitlist_limit`); `0` switches the
  waiting list off (`422 waitlist_disabled`);
- the slot is really full (`409 slot_available` otherwise), and the person neither has a place in
  it (`409 already_booked`) nor waits for it already (`409 already_waiting`).

A shared lane (#95) is full when no place remains; an exclusive court when anything holds it. Club
season dates are not offered to the waiting list in the app.

## Offers and holds

Every command that frees a place calls `WaitlistOffers.offer` (`shared/application`) in its own
transaction, so the offer and its notices commit with the cancellation that made it possible:

| Freed by | Command |
|---|---|
| The person cancels or moves a booking | `UpdateBooking` |
| The council cancels a booking | `ManageBooking` |
| A club date or a whole season slot is cancelled | `CancelSeasonOccurrence`, `CancelSeasonAllocation` |
| An account is deleted | `DeleteAccount` |
| A lane's capacity goes up or a court is back in service | `SaveFacilityResources` |
| An offer expires or the person leaves the list | `ExpireWaitlistOffers`, `LeaveWaitlist` |

Under the facility lock, the matcher walks the people waiting for slots overlapping the freed
interval, oldest first. It skips, without removing, anyone who could not book now (blocked or at
the active-booking limit). For each other person it tries to **hold** the place: a `booking_units`
row owned by the entry (`waitlist_entry_id`), with the same capacity check and exclusion
constraint as a booking of that person. So while the offer lasts, availability, suggestions and
other people's bookings all see the slot as taken.

A held entry is `offered` until `offer_expires_at`: `waitlist_offer_minutes` (5–240, default 30)
from now, and never after the slot starts. The person gets an in-app notice, an email and a push
notice (`waitlist_offer`, notice kind `waitlist`, on by default). An entry is offered once, so its id
is the outbox deduplication key and a repeated worker pass sends nothing twice.

A closed facility offers nothing: closing it ends its entries as `closed` and drops their holds.

## Confirming, letting it expire, leaving

- **Confirming** is `POST /v2/citizen/bookings` with `waitlistEntryId`. In one transaction
  `CreateBooking` saves the booking, turns the open offer into `accepted` (`409 offer_closed` if it
  expired or is not the person's), releases the hold and books the place with the normal rules. If
  any rule fails, the rollback keeps the hold and the offer.
- **Expiring:** the worker runs `ExpireWaitlistOffers` for each council on every pass, before
  claiming messages. It takes the facility lock, ends the offers whose time is up as `expired`,
  releases their holds and offers each place to the next person. The status guard makes repeated
  or concurrent runs harmless. Messages of an offer that is no longer open are closed as
  `skipped:offer_closed`.
- **Leaving** is `DELETE /v2/citizen/waitlist/:id`; a held place goes to the next person at once.

`GET /v2/citizen/waitlist` lists the person's open entries with their place in the queue (from 1;
0 while offered) and the offer's deadline. The app shows them under **As miñas reservas → En
espera**, with a notice on the default tab when a place is held.

## Council side

- **Settings (M2):** `waitlistMaxEntries` and `waitlistOfferMinutes` in **Axustes → Regras de
  reserva**.
- **Day bookings:** each booking shows how many people wait for the same slot of its court.
- **Indicators (M3):** offers accepted and expired in the period, from `waitlist_outcomes`, which
  keeps daily counts per facility without people. They are in the CSV export too.

## Data protection and portability (T4, T3)

Entries are deleted as soon as their slot ends (the worker on every pass, and retention as a
backstop) and when the account is deleted, which passes any held place on. The personal data
download includes the person's entries. A municipality export carries the entries of slots still to
come and the outcomes, not past entries; an open offer holds its place again on import. See
[data protection](data-protection.md) and [data portability](data-portability.md).
