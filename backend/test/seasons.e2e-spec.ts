// SPDX-License-Identifier: AGPL-3.0-or-later
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { randomUUID } from "node:crypto";
import request from "supertest";
import { Temporal } from "@js-temporal/polyfill";
import {
  type Tenant,
  facility,
  harness,
  patch,
  post,
  setup,
  slotStatus,
  teardown,
  tenant,
} from "./harness";
beforeAll(setup);
afterAll(teardown);
const ZONE = "Europe/Madrid";
const today = () => Temporal.Now.zonedDateTimeISO(ZONE).toPlainDate();
/** Instant of a local date and time in the test municipality. */
function at(date: Temporal.PlainDate, time: string) {
  return date
    .toPlainDateTime(Temporal.PlainTime.from(time))
    .toZonedDateTime(ZONE)
    .toInstant()
    .toString();
}
function holidays(date: Temporal.PlainDate) {
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Quenda//Holidays//GL",
    "BEGIN:VEVENT",
    "UID:local-holiday@quenda",
    "DTSTAMP:20260101T000000Z",
    `DTSTART;VALUE=DATE:${date.toString().replaceAll("-", "")}`,
    "SUMMARY:Festa local",
    "END:VEVENT",
    "END:VCALENDAR",
    "",
  ].join("\r\n");
}
async function club(context: Tenant, name = "Club Pádel Proba") {
  const created = await post(context.manager, "manager/organizations", {
    name,
    taxId: "g15000001",
    sport: "padel",
    contactEmail: "Club@Example.invalid",
  }).expect(201);
  return created.body.id as string;
}
async function campaign(
  context: Tenant,
  facilityIds: string[],
  days = 20,
): Promise<string> {
  const created = await post(context.manager, "manager/season-campaigns", {
    name: "Curso de proba",
    startsOn: today().add({ days: 1 }).toString(),
    endsOn: today().add({ days }).toString(),
    criteria: { gl: "Clubs con sede local", es: "Clubes con sede local" },
    facilityIds,
  }).expect(201);
  return created.body.id as string;
}
describe("Season allocation of recurring slots to clubs", () => {
  it("should hold the club's weekly slot in availability while the rest stays bookable", async () => {
    const context = await tenant();
    const court = await facility(context);
    const first = today().add({ days: 3 });
    const second = today().add({ days: 5 });
    // A one-off booking made before the season was assigned keeps its date.
    const earlier = randomUUID();
    await post(context.citizen, "citizen/bookings", {
      id: earlier,
      facilityId: court.id,
      start: at(second, "19:00"),
    }).expect(201);
    await harness.db.query(
      "UPDATE municipalities SET holidays_calendar=$2 WHERE id=$1",
      [context.id, holidays(first.add({ days: 7 }))],
    );
    const organizationId = await club(context);
    const campaignId = await campaign(context, [court.id]);
    const assigned = await post(context.manager, "manager/season-allocations", {
      campaignId,
      organizationId,
      facilityId: court.id,
      resourceId: court.id,
      weekdays: [first.dayOfWeek, second.dayOfWeek],
      startsLocal: "19:00",
      endsLocal: "21:00",
      reason: "Escola de menores con sede no concello",
    }).expect(201);
    expect(assigned.body.conflicts).toMatchObject([
      { start: at(second, "19:00"), bookingId: earlier },
    ]);
    expect(assigned.body.created).toBeGreaterThanOrEqual(4);
    expect(assigned.body.allocation).toMatchObject({
      organizationName: "Club Pádel Proba",
      startsLocal: "19:00",
      endsLocal: "21:00",
      active: assigned.body.created,
    });
    expect(await slotStatus(context, court.id, at(first, "19:00"))).toBe(
      "season",
    );
    expect(await slotStatus(context, court.id, at(first, "20:00"))).toBe(
      "season",
    );
    expect(await slotStatus(context, court.id, at(first, "21:00"))).toBe(
      "available",
    );
    expect(await slotStatus(context, court.id, at(second, "19:00"))).toBe(
      "booked",
    );
    await post(context.citizen, "citizen/bookings", {
      id: randomUUID(),
      facilityId: court.id,
      start: at(first, "20:00"),
    }).expect(409);
    await post(context.citizen, "citizen/bookings", {
      id: randomUUID(),
      facilityId: court.id,
      start: at(first, "21:00"),
    }).expect(201);
    // Holidays do not cancel season slots.
    const holiday = await harness.db.query(
      "SELECT status FROM season_occurrences WHERE tenant_id=$1 AND starts_at=$2",
      [context.id, at(first.add({ days: 7 }), "19:00")],
    );
    expect(holiday.rows).toEqual([{ status: "active" }]);
    const listed = await context.manager
      .get("/v2/manager/season-allocations")
      .query({ campaignId })
      .expect(200);
    expect(listed.body).toHaveLength(1);
    expect(listed.body[0].conflicts).toHaveLength(1);
  });
  it("should free one date or the whole slot with a reason and record each decision", async () => {
    const context = await tenant();
    const court = await facility(context);
    const day = today().add({ days: 4 });
    const organizationId = await club(context);
    const campaignId = await campaign(context, [court.id], 15);
    const assigned = await post(context.manager, "manager/season-allocations", {
      campaignId,
      organizationId,
      facilityId: court.id,
      resourceId: court.id,
      weekdays: [day.dayOfWeek],
      startsLocal: "10:00",
      endsLocal: "11:00",
      reason: "Adestramento",
    }).expect(201);
    const allocationId = assigned.body.allocation.id as string;
    const occurrence = await harness.db.query<{ id: string }>(
      "SELECT id FROM season_occurrences WHERE tenant_id=$1 AND starts_at=$2",
      [context.id, at(day, "10:00")],
    );
    await patch(
      context.manager,
      `manager/season-occurrences/${occurrence.rows[0].id}`,
      { status: "cancelled", reason: "" },
    ).expect(400);
    await patch(
      context.manager,
      `manager/season-occurrences/${occurrence.rows[0].id}`,
      { status: "cancelled", reason: "Torneo municipal" },
    ).expect(204);
    expect(await slotStatus(context, court.id, at(day, "10:00"))).toBe(
      "available",
    );
    const cancelled = await patch(
      context.manager,
      `manager/season-allocations/${allocationId}`,
      { status: "cancelled", reason: "O club deixa a instalación" },
    ).expect(200);
    expect(cancelled.body.freed).toBe(assigned.body.created - 1);
    expect(
      await slotStatus(context, court.id, at(day.add({ days: 7 }), "10:00")),
    ).toBe("available");
    const audit = await harness.db.query<{ action: string }>(
      "SELECT action FROM audit_events WHERE tenant_id=$1 ORDER BY occurred_at, action",
      [context.id],
    );
    expect(audit.rows.map((row) => row.action)).toEqual(
      expect.arrayContaining([
        "organization.created",
        "season_campaign.created",
        "season_allocation.created",
        "season_occurrence.cancelled",
        "season_allocation.cancelled",
      ]),
    );
  });
  it("should let a person represent one club and show them its slots", async () => {
    const context = await tenant();
    const court = await facility(context);
    await harness.db.query("UPDATE users SET email=$2 WHERE id=$1", [
      context.users.citizen,
      "socio@example.invalid",
    ]);
    const organizationId = await club(context);
    const other = await club(context, "Outro club");
    await post(
      context.manager,
      `manager/organizations/${organizationId}/representatives`,
      { email: "SOCIO@example.invalid" },
    ).expect(201);
    await post(
      context.manager,
      `manager/organizations/${other}/representatives`,
      { email: "socio@example.invalid" },
    ).expect(400);
    await post(
      context.manager,
      `manager/organizations/${other}/representatives`,
      { email: "ninguen@example.invalid" },
    ).expect(404);
    const listed = await context.manager
      .get("/v2/manager/organizations")
      .expect(200);
    expect(listed.body).toMatchObject(
      expect.arrayContaining([
        expect.objectContaining({
          id: organizationId,
          taxId: "G15000001",
          contactEmail: "club@example.invalid",
          representatives: [
            expect.objectContaining({ userId: context.users.citizen }),
          ],
        }),
      ]),
    );
    const day = today().add({ days: 2 });
    await post(context.manager, "manager/season-allocations", {
      campaignId: await campaign(context, [court.id], 9),
      organizationId,
      facilityId: court.id,
      resourceId: court.id,
      weekdays: [day.dayOfWeek],
      startsLocal: "18:00",
      endsLocal: "19:30",
      reason: "Competición",
    }).expect(201);
    const mine = await context.citizen.get("/v2/citizen/me/club").expect(200);
    expect(mine.body.organization).toMatchObject({
      id: organizationId,
      name: "Club Pádel Proba",
    });
    expect(mine.body.occurrences[0]).toMatchObject({
      start: at(day, "18:00"),
      end: at(day, "19:30"),
    });
    // Season slots are not personal bookings and do not use the representative's quota.
    for (let hour = 9; hour < 14; hour++)
      await post(context.citizen, "citizen/bookings", {
        id: randomUUID(),
        facilityId: court.id,
        start: at(today().add({ days: 3 }), `${hour}:00`.padStart(5, "0")),
      }).expect(201);
    await patch(context.manager, `manager/organizations/${organizationId}`, {
      name: "Club Pádel Proba",
      archived: true,
    }).expect(204);
    await post(context.manager, "manager/season-allocations", {
      campaignId: await campaign(context, [court.id], 9),
      organizationId,
      facilityId: court.id,
      resourceId: court.id,
      weekdays: [day.dayOfWeek],
      startsLocal: "08:00",
      endsLocal: "09:00",
      reason: "Arquivado",
    }).expect(400);
  });
  it("should keep season management to the municipality's managers", async () => {
    const context = await tenant();
    const other = await tenant();
    const court = await facility(context);
    const campaignId = await campaign(context, [court.id]);
    await context.citizen.get("/v2/manager/organizations").expect(403);
    await post(context.citizen, "manager/organizations", {
      name: "Club pirata",
    }).expect(403);
    await other.manager
      .get("/v2/manager/season-allocations")
      .query({ campaignId })
      .expect(404);
    await post(other.manager, "manager/season-campaigns", {
      name: "Alleo",
      startsOn: today().toString(),
      endsOn: today().add({ days: 10 }).toString(),
      criteria: { gl: "", es: "" },
      facilityIds: [court.id],
    }).expect(400);
    const published = await request(harness.app.getHttpServer())
      .get("/v2/public/season-campaigns")
      .query({ slug: context.slug })
      .expect(200);
    expect(published.body).toMatchObject([
      {
        id: campaignId,
        criteria: { gl: "Clubs con sede local" },
        facilityIds: [court.id],
      },
    ]);
  });
  it("should carry the season in the municipality's export", async () => {
    const context = await tenant();
    const court = await facility(context);
    const day = today().add({ days: 2 });
    const organizationId = await club(context);
    const campaignId = await campaign(context, [court.id], 9);
    await post(context.manager, "manager/season-allocations", {
      campaignId,
      organizationId,
      facilityId: court.id,
      resourceId: court.id,
      weekdays: [day.dayOfWeek, day.add({ days: 1 }).dayOfWeek],
      startsLocal: "17:00",
      endsLocal: "18:00",
      reason: "Exportación",
    }).expect(201);
    const pack = await context.manager.get("/v2/manager/export").expect(200);
    expect(pack.body.organizations).toMatchObject([{ id: organizationId }]);
    expect(pack.body.seasonCampaigns).toMatchObject([
      { id: campaignId, facilityIds: [court.id] },
    ]);
    expect(pack.body.seasonAllocations[0].rrule).toMatch(
      /^FREQ=WEEKLY;BYDAY=[A-Z]{2},[A-Z]{2};UNTIL=\d{8}$/,
    );
    expect(pack.body.seasonOccurrences.length).toBeGreaterThanOrEqual(2);
  });
});
