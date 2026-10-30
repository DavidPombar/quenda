// SPDX-License-Identifier: AGPL-3.0-or-later
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { randomUUID } from "node:crypto";
import { Temporal } from "@js-temporal/polyfill";
import {
  type Tenant,
  facility,
  harness,
  patch,
  post,
  setup,
  start,
  teardown,
  tenant,
} from "./harness";
beforeAll(setup);
afterAll(teardown);
const zone = "Europe/Madrid";
/** Open 10:00–13:00 every day: three one-hour slots, easy to fill. */
function morning(id: string) {
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Quenda//Opening hours//GL",
    "BEGIN:VEVENT",
    `UID:${id}@quenda`,
    "DTSTAMP:20260101T000000Z",
    "DTSTART;TZID=Europe/Madrid:20260101T100000",
    "DTEND;TZID=Europe/Madrid:20260101T130000",
    "RRULE:FREQ=DAILY",
    "SUMMARY:Apertura",
    "END:VEVENT",
    "END:VCALENDAR",
    "",
  ].join("\r\n");
}
const day = () =>
  Temporal.Now.zonedDateTimeISO(zone).add({ days: 3 }).toPlainDate();
function at(date: Temporal.PlainDate, hour: number) {
  return date
    .toZonedDateTime({
      timeZone: zone,
      plainTime: `${String(hour).padStart(2, "0")}:00`,
    })
    .toInstant();
}
async function court(context: Tenant, sport = "padel") {
  const created = await facility(context, morning(randomUUID()));
  if (sport !== "padel")
    await patch(context.manager, `manager/facilities/${created.id}`, {
      sport,
    }).expect(204);
  return created;
}
// Past reservations cannot be made through the API, so they are written as installed history.
async function past(
  context: Tenant,
  facilityId: string,
  begins: Temporal.Instant,
) {
  await harness.db.query(
    `WITH booking AS (
      INSERT INTO bookings (id,tenant_id,user_id,facility_id,resource_id,starts_at,ends_at,status,created_at)
      VALUES ($1,$2,$3,$4,$4,$5,$6,'confirmed',$7) RETURNING id
    )
    INSERT INTO booking_units (tenant_id,booking_id,unit_id,starts_at,ends_at)
    SELECT $2,id,$4,$5,$6 FROM booking`,
    [
      randomUUID(),
      context.id,
      context.users.citizen,
      facilityId,
      begins.toString(),
      begins.add({ hours: 1 }).toString(),
      begins.subtract({ hours: 48 }).toString(),
    ],
  );
}
/**
 * Without a status history, the insights take each facility's current status for the whole range,
 * as if it had been active (or in maintenance) for months.
 */
async function activeSinceLongAgo(context: Tenant) {
  await harness.db.query(
    "DELETE FROM facility_status_periods WHERE tenant_id=$1",
    [context.id],
  );
}
async function fill(
  context: Tenant,
  facilityId: string,
  date: Temporal.PlainDate,
) {
  for (const hour of [10, 11, 12])
    await post(context.citizen, "citizen/bookings", {
      id: randomUUID(),
      facilityId,
      start: at(date, hour).toString(),
    }).expect(201);
}
interface Suggestion {
  facilityId: string;
  start: string;
  occupancyPct: number | null;
  sameFacility: boolean;
}
async function suggestions(
  context: Tenant,
  query: Record<string, string>,
  status = 200,
) {
  const response = await context.citizen
    .get("/v2/public/slot-suggestions")
    .query({ slug: context.slug, ...query })
    .expect(status);
  return (response.body as { suggestions: Suggestion[] }).suggestions;
}
describe("Alternative slots ranked by usual occupancy", () => {
  it("should offer the three least usually occupied free slots of the same sport that day", async () => {
    const context = await tenant();
    const full = await court(context);
    const other = await court(context);
    const tennis = await court(context, "tennis");
    const closed = await court(context);
    await patch(context.manager, `manager/facilities/${closed.id}`, {
      status: "maintenance",
    }).expect(204);
    await activeSinceLongAgo(context);
    const date = day();
    // History of the same weekday: 10:00 is busy, 12:00 a little, 11:00 never.
    for (const weeks of [2, 3]) {
      const earlier = date.subtract({ weeks });
      await past(context, other.id, at(earlier, 10));
      if (weeks === 2) await past(context, other.id, at(earlier, 12));
    }
    await fill(context, full.id, date);
    const result = await suggestions(context, {
      facilityId: full.id,
      date: date.toString(),
      around: at(date, 11).toString(),
    });
    expect(
      result.map((value) => [
        value.facilityId,
        value.start,
        value.occupancyPct,
        value.sameFacility,
      ]),
    ).toEqual([
      [other.id, at(date, 11).toString(), 0, false],
      [other.id, at(date, 12).toString(), 8, false],
      [other.id, at(date, 10).toString(), 17, false],
    ]);
    expect(
      result.some((value) => [tennis.id, closed.id].includes(value.facilityId)),
    ).toBe(false);
  });
  it("should rank by closeness to the wanted time when the municipality has no history yet", async () => {
    const context = await tenant();
    const neighbour = await tenant();
    const wanted = await court(context);
    const other = await court(context);
    const elsewhere = await court(neighbour);
    const date = day();
    await post(context.citizen, "citizen/bookings", {
      id: randomUUID(),
      facilityId: wanted.id,
      start: at(date, 11).toString(),
    }).expect(201);
    const result = await suggestions(context, {
      facilityId: wanted.id,
      date: date.toString(),
      around: at(date, 11).toString(),
    });
    expect(result).toHaveLength(3);
    expect(result.every((value) => value.occupancyPct === null)).toBe(true);
    // The other facility's 11:00 is the closest; then the wanted facility at 10:00 and 12:00.
    expect(result[0]).toMatchObject({
      facilityId: other.id,
      start: at(date, 11).toString(),
    });
    expect(
      result.slice(1).map((value) => [value.facilityId, value.start]),
    ).toEqual([
      [wanted.id, at(date, 10).toString()],
      [wanted.id, at(date, 12).toString()],
    ]);
    expect(result.some((value) => value.facilityId === elsewhere.id)).toBe(
      false,
    );
  });
  it("should reject malformed dates and unknown facilities", async () => {
    const context = await tenant();
    const wanted = await court(context);
    await suggestions(
      context,
      { facilityId: wanted.id, date: "2026-13-40" },
      400,
    );
    await suggestions(
      context,
      { facilityId: wanted.id, date: day().toString(), around: "tomorrow" },
      400,
    );
    await suggestions(
      context,
      { facilityId: randomUUID(), date: day().toString() },
      404,
    );
    expect(
      await suggestions(context, {
        facilityId: wanted.id,
        date: start(400).slice(0, 10),
      }),
    ).toEqual([]);
  });
});
