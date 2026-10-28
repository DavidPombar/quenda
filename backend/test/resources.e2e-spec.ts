// SPDX-License-Identifier: AGPL-3.0-or-later
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { Temporal } from "@js-temporal/polyfill";
import { migrate } from "../src/database/migrate";
import {
  type ResourceSlots,
  type Tenant,
  addResources,
  availability,
  emptyDatabase,
  facility,
  harness,
  patch,
  post,
  setup,
  slotStatus,
  start,
  teardown,
  tenant,
} from "./harness";
beforeAll(setup);
afterAll(teardown);
function book(
  context: Tenant,
  facilityId: string,
  begins: string,
  resourceId?: string,
  id = randomUUID(),
) {
  return post(context.citizen, "citizen/bookings", {
    id,
    facilityId,
    ...(resourceId ? { resourceId } : {}),
    start: begins,
  });
}
/** A divisible hall: the default resource is the whole court and gets three parts. */
async function hall(context: Tenant, calendar?: string) {
  const court = await facility(context, calendar);
  const [a, b, c] = await addResources(context, court.id, [
    { name: "Tercio A", parentId: court.id },
    { name: "Tercio B", parentId: court.id },
    { name: "Tercio C", parentId: court.id },
  ]);
  return { court, whole: court.id, thirds: [a, b, c] };
}
async function statuses(context: Tenant, facilityId: string, begins: string) {
  const resources = (await availability(context, facilityId, begins)).body
    .resources as ResourceSlots[];
  return Object.fromEntries(
    resources.map((resource) => [
      resource.name,
      resource.slots.find((slot) => slot.start === begins)?.status,
    ]),
  );
}
describe("Courts and divisible spaces (M1, C1, C2) through HTTP and PostgreSQL", () => {
  it("should list resources and give each one its own slots when a facility has several courts", async () => {
    const context = await tenant();
    const court = await facility(context);
    const [second, closed] = await addResources(context, court.id, [
      { name: "Pista 2" },
      { name: "Pista 3", active: false },
    ]);
    const catalog = await context.citizen
      .get("/v2/public/facilities")
      .query({ slug: context.slug })
      .expect(200);
    expect(catalog.body[0].resources).toEqual([
      {
        id: court.id,
        name: court.name,
        parentId: null,
        active: true,
        position: 0,
      },
      {
        id: second,
        name: "Pista 2",
        parentId: null,
        active: true,
        position: 1,
      },
      {
        id: closed,
        name: "Pista 3",
        parentId: null,
        active: false,
        position: 2,
      },
    ]);
    const begins = start();
    const body = (await availability(context, court.id, begins)).body;
    expect(Object.keys(body)).toEqual(["resources"]);
    expect(
      body.resources.map((resource: ResourceSlots) => ({
        ...resource,
        slots: resource.slots.length,
      })),
    ).toEqual([
      {
        id: court.id,
        name: court.name,
        parentId: null,
        active: true,
        slots: 13,
      },
      { id: second, name: "Pista 2", parentId: null, active: true, slots: 13 },
      { id: closed, name: "Pista 3", parentId: null, active: false, slots: 0 },
    ]);
    expect(
      body.resources[1].slots.find(
        (slot: { start: string }) => slot.start === begins,
      ),
    ).toEqual({
      start: begins,
      end: Temporal.Instant.from(begins).add({ hours: 1 }).toString(),
      status: "available",
    });
  });
  it("should keep courts independent when two people book different courts at the same time", async () => {
    const context = await tenant();
    const court = await facility(context);
    const [second] = await addResources(context, court.id, [
      { name: "Pista 2" },
    ]);
    const begins = start();
    await book(context, court.id, begins, court.id).expect(201);
    expect(await statuses(context, court.id, begins)).toEqual({
      [court.name]: "booked",
      "Pista 2": "available",
    });
    expect(
      (await book(context, court.id, begins, court.id).expect(409)).body.code,
    ).toBe("slot_taken");
    await post(context.manager, "citizen/bookings", {
      id: randomUUID(),
      facilityId: court.id,
      resourceId: second,
      start: begins,
    }).expect(201);
    expect(await statuses(context, court.id, begins)).toEqual({
      [court.name]: "booked",
      "Pista 2": "booked",
    });
  });
  it("should block every part with the whole court and the whole court with any part when a hall is divisible", async () => {
    const context = await tenant();
    const { court, whole, thirds } = await hall(context);
    const first = start(2, 10);
    await book(context, court.id, first, whole).expect(201);
    for (const third of thirds)
      expect(
        (await book(context, court.id, first, third).expect(409)).body.code,
      ).toBe("slot_taken");
    expect(await statuses(context, court.id, first)).toEqual({
      [court.name]: "booked",
      "Tercio A": "booked",
      "Tercio B": "booked",
      "Tercio C": "booked",
    });
    const second = start(2, 12);
    await book(context, court.id, second, thirds[0]).expect(201);
    expect(
      (await book(context, court.id, second, whole).expect(409)).body.code,
    ).toBe("slot_taken");
    await book(context, court.id, second, thirds[1]).expect(201);
    expect(await statuses(context, court.id, second)).toEqual({
      [court.name]: "booked",
      "Tercio A": "booked",
      "Tercio B": "booked",
      "Tercio C": "available",
    });
  });
  it("should commit only one reservation when the whole court and a part are claimed concurrently", async () => {
    const context = await tenant();
    const { court, whole, thirds } = await hall(context);
    const begins = start();
    const results = await Promise.all([
      post(context.citizen, "citizen/bookings", {
        id: randomUUID(),
        facilityId: court.id,
        resourceId: whole,
        start: begins,
      }),
      post(context.manager, "citizen/bookings", {
        id: randomUUID(),
        facilityId: court.id,
        resourceId: thirds[1],
        start: begins,
      }),
    ]);
    expect(results.map((result) => result.status).sort()).toEqual([201, 409]);
    const rows = await harness.db.query(
      "SELECT count(*)::int AS count FROM bookings WHERE tenant_id=$1",
      [context.id],
    );
    expect(rows.rows[0].count).toBe(1);
  });
  it("should require a resource when several are active and use the only one otherwise", async () => {
    const context = await tenant();
    const court = await facility(context);
    const single = await book(context, court.id, start(1)).expect(201);
    expect(single.body.resourceId).toBe(court.id);
    await addResources(context, court.id, [{ name: "Pista 2" }]);
    expect(
      (await book(context, court.id, start(2)).expect(422)).body.code,
    ).toBe("resource_required");
    const other = await facility(context);
    await addResources(context, other.id, [{ name: "Fóra", active: false }]);
    await book(context, other.id, start(2)).expect(201);
  });
  it("should reject out-of-service resources and resources of other facilities or municipalities", async () => {
    const context = await tenant();
    const court = await facility(context);
    const [closed] = await addResources(context, court.id, [
      { name: "Pista 2", active: false },
    ]);
    const begins = start();
    const response = await book(context, court.id, begins, closed).expect(422);
    expect(response.body).toMatchObject({
      code: "resource_unavailable",
      status: 422,
    });
    expect(response.body.detail).toContain("fóra de servizo");
    expect(await slotStatus(context, court.id, begins, closed)).toBeUndefined();
    const other = await facility(context);
    expect(
      (await book(context, court.id, begins, other.id).expect(404)).body.code,
    ).toBe("not_found");
    const foreign = await tenant();
    const foreignCourt = await facility(foreign);
    await book(context, court.id, begins, foreignCourt.id).expect(404);
    await book(foreign, foreignCourt.id, begins, court.id).expect(404);
    await post(context.citizen, "citizen/bookings", {
      id: randomUUID(),
      facilityId: court.id,
      resourceId: "not-a-uuid",
      start: begins,
    }).expect(400);
  });
  it("should reuse an idempotent request only with the same resource", async () => {
    const context = await tenant();
    const court = await facility(context);
    const [second] = await addResources(context, court.id, [
      { name: "Pista 2" },
    ]);
    const id = randomUUID();
    const begins = start();
    await book(context, court.id, begins, court.id, id).expect(201);
    await book(context, court.id, begins, court.id, id).expect(201);
    expect(
      (await book(context, court.id, begins, second, id).expect(409)).body.code,
    ).toBe("id_reused");
  });
  it("should free the previous court and audit both resources when a reservation moves to another court", async () => {
    const context = await tenant();
    const court = await facility(context);
    const [second] = await addResources(context, court.id, [
      { name: "Pista 2" },
    ]);
    const elsewhere = await facility(context);
    const id = randomUUID();
    const begins = start();
    await book(context, court.id, begins, court.id, id).expect(201);
    await patch(context.citizen, `citizen/bookings/${id}`, {
      resourceId: elsewhere.id,
    }).expect(404);
    await patch(context.citizen, `citizen/bookings/${id}`, {
      resourceId: second,
      status: "cancelled",
    }).expect(400);
    await patch(context.citizen, `citizen/bookings/${id}`, {
      resourceId: second,
    }).expect(204);
    expect(await statuses(context, court.id, begins)).toEqual({
      [court.name]: "available",
      "Pista 2": "booked",
    });
    const later = start(3, 11);
    await patch(context.citizen, `citizen/bookings/${id}`, {
      start: later,
      resourceId: court.id,
    }).expect(204);
    expect(await statuses(context, court.id, begins)).toEqual({
      [court.name]: "available",
      "Pista 2": "available",
    });
    expect(await slotStatus(context, court.id, later)).toBe("booked");
    const history = await context.citizen
      .get("/v2/citizen/bookings")
      .expect(200);
    expect(history.body[0]).toMatchObject({
      id,
      resourceId: court.id,
      resourceName: court.name,
      start: later,
    });
    const audit = await harness.db.query(
      "SELECT details FROM audit_events WHERE tenant_id=$1 AND action='booking.rescheduled' ORDER BY occurred_at",
      [context.id],
    );
    expect(audit.rows[0].details).toMatchObject({
      from: { start: begins, resourceId: court.id },
      to: { start: begins, resourceId: second },
    });
    expect(audit.rows[1].details).toMatchObject({
      from: { start: begins, resourceId: second },
      to: { start: later, resourceId: court.id },
    });
  });
  it("should release every unit when a whole-court reservation is cancelled", async () => {
    const context = await tenant();
    const { court, whole } = await hall(context);
    const id = randomUUID();
    const begins = start();
    await book(context, court.id, begins, whole, id).expect(201);
    const units = await harness.db.query(
      "SELECT count(*)::int AS count FROM booking_units WHERE tenant_id=$1 AND booking_id=$2",
      [context.id, id],
    );
    expect(units.rows[0].count).toBe(3);
    await patch(context.citizen, `citizen/bookings/${id}`, {
      status: "cancelled",
    }).expect(204);
    expect(
      (
        await harness.db.query(
          "SELECT count(*)::int AS count FROM booking_units WHERE tenant_id=$1",
          [context.id],
        )
      ).rows[0].count,
    ).toBe(0);
    expect(await statuses(context, court.id, begins)).toEqual({
      [court.name]: "available",
      "Tercio A": "available",
      "Tercio B": "available",
      "Tercio C": "available",
    });
    const audit = await harness.db.query(
      "SELECT details FROM audit_events WHERE tenant_id=$1 AND action='booking.cancelled'",
      [context.id],
    );
    expect(audit.rows[0].details).toMatchObject({ resourceId: whole });
  });
  it("should free the court when the municipality cancels a reservation or closes the facility", async () => {
    const context = await tenant();
    const { court, whole } = await hall(context);
    const cancelled = randomUUID();
    const closed = randomUUID();
    const first = start(2, 10);
    const second = start(2, 12);
    await book(context, court.id, first, whole, cancelled).expect(201);
    await book(context, court.id, second, whole, closed).expect(201);
    const occupied = async () =>
      (
        await harness.db.query(
          "SELECT count(*)::int AS count FROM booking_units WHERE tenant_id=$1",
          [context.id],
        )
      ).rows[0].count as number;
    expect(await occupied()).toBe(6);
    await patch(context.manager, `manager/bookings/${cancelled}`, {
      status: "cancelled",
      reason: "Avaría na iluminación",
    }).expect(204);
    expect(await occupied()).toBe(3);
    expect(await slotStatus(context, court.id, first)).toBe("available");
    await patch(context.manager, `manager/facilities/${court.id}`, {
      status: "closed",
      closureReason: "Obras urxentes na cuberta",
    }).expect(204);
    expect(await occupied()).toBe(0);
  });
  it("should count each part of a divisible hall and stay within 100 % when the whole court is booked", async () => {
    const context = await tenant();
    const day = Temporal.Instant.from(start())
      .toZonedDateTimeISO("Europe/Madrid")
      .toPlainDate()
      .toString()
      .replaceAll("-", "");
    const calendar = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Quenda//Test//GL",
      "BEGIN:VEVENT",
      `UID:${randomUUID()}@quenda`,
      "DTSTAMP:20260101T000000Z",
      `DTSTART;TZID=Europe/Madrid:${day}T100000`,
      `DTEND;TZID=Europe/Madrid:${day}T110000`,
      "SUMMARY:Apertura",
      "END:VEVENT",
      "END:VCALENDAR",
      "",
    ].join("\r\n");
    const { court, whole } = await hall(context, calendar);
    await book(context, court.id, start(2, 10), whole).expect(201);
    const stats = await context.manager.get("/v2/manager/insights").expect(200);
    expect(stats.body).toMatchObject({
      confirmed: 1,
      occupancy: 100,
      byFacility: [{ id: court.id, bookings: 1 }],
    });
  });
});
describe("Resources migration from V0 databases", () => {
  it("should keep reservations, occupied slots and the overlap guarantee when the resources upgrade runs", async () => {
    const { db, url, drop } = await emptyDatabase();
    try {
      await db.query(
        await readFile(
          new URL("./fixtures/schema-v0.sql", import.meta.url),
          "utf8",
        ),
      );
      const tenantId = randomUUID();
      const userId = randomUUID();
      const facilityId = randomUUID();
      const idle = randomUUID();
      const confirmed = randomUUID();
      const cancelled = randomUUID();
      const begins = Temporal.Instant.from(start());
      const ends = begins.add({ hours: 1 });
      await db.query(
        "INSERT INTO municipalities (id,slug,name,timezone,advance_days,cancellation_hours,max_active_bookings,contact,legal_text) VALUES ($1,$2,'V0','Europe/Madrid',14,2,5,'v0@example.invalid','V0')",
        [tenantId, `v0-${tenantId}`],
      );
      await db.query(
        "INSERT INTO users VALUES ($1,$2,'V0 citizen','citizen')",
        [userId, tenantId],
      );
      for (const [id, name] of [
        [facilityId, "Pavillón V0"],
        [idle, "Pista sen reservas"],
      ])
        await db.query(
          "INSERT INTO facilities VALUES ($1,$2,$3,'futsal','Rúa','V0',true,'active',60,0,'BEGIN:VCALENDAR','')",
          [id, tenantId, name],
        );
      await db.query(
        "INSERT INTO bookings (id,tenant_id,user_id,facility_id,starts_at,ends_at,status,created_at) VALUES ($1,$2,$3,$4,$5,$6,'confirmed',$5)",
        [
          confirmed,
          tenantId,
          userId,
          facilityId,
          begins.toString(),
          ends.toString(),
        ],
      );
      await db.query(
        "INSERT INTO bookings (id,tenant_id,user_id,facility_id,starts_at,ends_at,status,created_at,cancelled_at) VALUES ($1,$2,$3,$4,$5,$6,'cancelled',$5,$5)",
        [
          cancelled,
          tenantId,
          userId,
          facilityId,
          begins.toString(),
          ends.toString(),
        ],
      );
      // The runner adopts the V0 database; a second run finds nothing pending.
      await migrate(url, () => undefined);
      await migrate(url, () => undefined);
      expect(
        (
          await db.query(
            "SELECT id, facility_id, name, parent_id, active FROM resources ORDER BY name",
          )
        ).rows,
      ).toEqual([
        {
          id: facilityId,
          facility_id: facilityId,
          name: "Pavillón V0",
          parent_id: null,
          active: true,
        },
        {
          id: idle,
          facility_id: idle,
          name: "Pista sen reservas",
          parent_id: null,
          active: true,
        },
      ]);
      expect(
        (
          await db.query(
            "SELECT id, resource_id FROM bookings ORDER BY status DESC",
          )
        ).rows,
      ).toEqual([
        { id: confirmed, resource_id: facilityId },
        { id: cancelled, resource_id: facilityId },
      ]);
      expect(
        (
          await db.query(
            "SELECT booking_id, unit_id FROM booking_units WHERE tenant_id=$1",
            [tenantId],
          )
        ).rows,
      ).toEqual([{ booking_id: confirmed, unit_id: facilityId }]);
      // The availability read sees the slot as occupied.
      expect(
        (
          await db.query(
            "SELECT count(*)::int AS count FROM booking_units u JOIN resources r ON r.tenant_id=u.tenant_id AND r.id=u.unit_id WHERE r.tenant_id=$1 AND r.facility_id=$2 AND u.starts_at<$4 AND u.ends_at>$3",
            [tenantId, facilityId, begins.toString(), ends.toString()],
          )
        ).rows[0].count,
      ).toBe(1);
      const constraints = await db.query(
        "SELECT conname FROM pg_constraint WHERE conrelid='bookings'::regclass AND contype IN ('x','f') ORDER BY conname",
      );
      expect(constraints.rows.map((row) => row.conname)).not.toContain(
        "bookings_no_overlap",
      );
      expect(constraints.rows.map((row) => row.conname)).toContain(
        "bookings_resource_fk",
      );
      const overlapping = randomUUID();
      await db.query(
        "INSERT INTO bookings (id,tenant_id,user_id,facility_id,resource_id,starts_at,ends_at,status,created_at) VALUES ($1,$2,$3,$4,$4,$5,$6,'confirmed',$5)",
        [
          overlapping,
          tenantId,
          userId,
          facilityId,
          begins.add({ minutes: 30 }).toString(),
          ends.add({ minutes: 30 }).toString(),
        ],
      );
      await expect(
        db.query(
          "INSERT INTO booking_units (tenant_id,booking_id,unit_id,starts_at,ends_at) VALUES ($1,$2,$3,$4,$5)",
          [
            tenantId,
            overlapping,
            facilityId,
            begins.add({ minutes: 30 }).toString(),
            ends.add({ minutes: 30 }).toString(),
          ],
        ),
      ).rejects.toMatchObject({
        code: "23P01",
        constraint: "booking_units_no_overlap",
      });
      await expect(
        db.query(
          "INSERT INTO bookings (id,tenant_id,user_id,facility_id,resource_id,starts_at,ends_at,status,created_at) VALUES ($1,$2,$3,$4,$5,$6,$7,'confirmed',$6)",
          [
            randomUUID(),
            tenantId,
            userId,
            facilityId,
            idle,
            begins.toString(),
            ends.toString(),
          ],
        ),
      ).rejects.toMatchObject({ code: "23503" });
    } finally {
      await drop();
    }
  });
});
