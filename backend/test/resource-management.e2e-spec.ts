// SPDX-License-Identifier: AGPL-3.0-or-later
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { randomUUID } from "node:crypto";
import {
  type Agent,
  type Tenant,
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
interface Court {
  id: string;
  name: string;
  parentId: string | null;
  active: boolean;
}
function save(agent: Agent, facilityId: string, resources: Court[]) {
  return agent
    .put(`/v2/manager/facilities/${facilityId}/resources`)
    .set("X-Quenda-Request", "1")
    .send({ resources });
}
async function courts(context: Tenant, facilityId: string) {
  const catalog = await context.citizen
    .get("/v2/public/facilities")
    .query({ slug: context.slug, pageSize: 50 })
    .expect(200);
  return (
    catalog.body.items as {
      id: string;
      resources: (Court & { position: number })[];
    }[]
  ).find((item) => item.id === facilityId)!.resources;
}
/** A hall split into thirds through the manager API. */
async function hall(context: Tenant) {
  const court = await facility(context);
  const thirds = ["Tercio A", "Tercio B", "Tercio C"].map((name) => ({
    id: randomUUID(),
    name,
    parentId: court.id,
    active: true,
  }));
  const whole = {
    id: court.id,
    name: "Pista completa",
    parentId: null,
    active: true,
  };
  await save(context.manager, court.id, [whole, ...thirds]).expect(200);
  return { court, whole, thirds };
}
describe("Court management in the backoffice (M1)", () => {
  it("should split a facility into parts that citizens can book separately", async () => {
    const context = await tenant();
    const { court, whole, thirds } = await hall(context);
    expect(await courts(context, court.id)).toEqual([
      { ...whole, position: 0 },
      ...thirds.map((third, index) => ({ ...third, position: index + 1 })),
    ]);
    const begins = start();
    await post(context.citizen, "citizen/bookings", {
      id: randomUUID(),
      facilityId: court.id,
      resourceId: thirds[0].id,
      start: begins,
    }).expect(201);
    expect(await slotStatus(context, court.id, begins, thirds[1].id)).toBe(
      "available",
    );
    expect(await slotStatus(context, court.id, begins)).toBe("booked");
    const insights = await context.manager
      .get("/v2/manager/insights")
      .expect(200);
    const usage = (
      insights.body.byFacility as {
        id: string;
        byResource: { id: string; confirmed: number; bookedMinutes: number }[];
      }[]
    ).find((item) => item.id === court.id)!.byResource;
    expect(usage.map((item) => item.id)).toEqual([
      whole.id,
      ...thirds.map((third) => third.id),
    ]);
    expect(usage.find((item) => item.id === thirds[0].id)).toMatchObject({
      confirmed: 1,
      bookedMinutes: 60,
    });
    // The whole court aggregates its parts: the third's hour shows as booked time there too.
    expect(usage.find((item) => item.id === whole.id)).toMatchObject({
      confirmed: 0,
      bookedMinutes: 60,
    });
    const audit = await harness.db.query(
      "SELECT details FROM audit_events WHERE tenant_id=$1 AND action='facility.resources_updated'",
      [context.id],
    );
    expect(audit.rows[0].details.after).toHaveLength(4);
  });
  it("should rename, reorder and take free courts out of service, and remove unused ones", async () => {
    const context = await tenant();
    const { court, whole, thirds } = await hall(context);
    const saved = await save(context.manager, court.id, [
      { ...thirds[1], active: false },
      { ...whole, name: "Pista central" },
      thirds[0],
    ]).expect(200);
    expect(saved.body.map((item: Court) => [item.name, item.active])).toEqual([
      ["Tercio B", false],
      ["Pista central", true],
      ["Tercio A", true],
    ]);
    expect(
      (await courts(context, court.id)).map((item) => item.id),
    ).not.toContain(thirds[2].id);
  });
  it("should refuse changes to courts with upcoming reservations and keep the reservation's slot", async () => {
    const context = await tenant();
    const { court, whole, thirds } = await hall(context);
    const begins = start();
    await post(context.citizen, "citizen/bookings", {
      id: randomUUID(),
      facilityId: court.id,
      resourceId: whole.id,
      start: begins,
    }).expect(201);
    const all = [whole, ...thirds];
    for (const changed of [
      [whole, thirds[0], thirds[1]],
      all.map((item) =>
        item === thirds[2] ? { ...item, active: false } : item,
      ),
      all.map((item) =>
        item === thirds[2] ? { ...item, parentId: null } : item,
      ),
      [
        ...all,
        {
          id: randomUUID(),
          name: "Tercio D",
          parentId: whole.id,
          active: true,
        },
      ],
    ])
      expect(
        (await save(context.manager, court.id, changed).expect(409)).body.code,
      ).toBe("resource_in_use");
    await save(context.manager, court.id, [
      { ...whole, name: "Pista central" },
      ...thirds,
    ]).expect(200);
    expect(await slotStatus(context, court.id, begins, thirds[2].id)).toBe(
      "booked",
    );
  });
  it("should keep courts with past reservations, which can only be taken out of service", async () => {
    const context = await tenant();
    const court = await facility(context);
    await harness.db.query(
      `WITH booking AS (
        INSERT INTO bookings (id,tenant_id,user_id,facility_id,resource_id,starts_at,ends_at,status,created_at)
        VALUES ($1,$2,$3,$4,$4,'2001-01-01T10:00:00Z','2001-01-01T11:00:00Z','confirmed','2001-01-01T09:00:00Z') RETURNING id
      )
      INSERT INTO booking_units SELECT $2,id,$4,'2001-01-01T10:00:00Z','2001-01-01T11:00:00Z' FROM booking`,
      [randomUUID(), context.id, context.users.citizen, court.id],
    );
    const replacement = {
      id: randomUUID(),
      name: "Pista nova",
      parentId: null,
      active: true,
    };
    expect(
      (await save(context.manager, court.id, [replacement]).expect(409)).body
        .code,
    ).toBe("resource_has_history");
    await save(context.manager, court.id, [
      { id: court.id, name: court.name, parentId: null, active: false },
      replacement,
    ]).expect(200);
  });
  it("should validate the set and keep it within the manager's municipality", async () => {
    const context = await tenant();
    const court = await facility(context);
    const other = await tenant();
    const foreign = await facility(other);
    const one = { id: court.id, name: "Pista", parentId: null, active: true };
    await save(context.manager, court.id, []).expect(400);
    await save(context.manager, court.id, [
      one,
      { ...one, id: randomUUID(), name: "pista" },
    ]).expect(400);
    await save(context.manager, court.id, [
      one,
      { id: randomUUID(), name: "Parte", parentId: randomUUID(), active: true },
    ]).expect(400);
    expect(
      (
        await save(context.manager, court.id, [
          one,
          { id: foreign.id, name: "Allea", parentId: null, active: true },
        ]).expect(409)
      ).body.code,
    ).toBe("id_reused");
    await save(context.manager, foreign.id, [one]).expect(404);
    await save(context.citizen, court.id, [one]).expect(403);
    await patch(context.manager, `manager/facilities/${court.id}`, {
      name: "Renamed facility",
    }).expect(204);
    expect((await courts(context, court.id))[0].name).toBe(court.name);
  });
});
