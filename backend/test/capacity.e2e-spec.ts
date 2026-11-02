// SPDX-License-Identifier: AGPL-3.0-or-later
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { randomUUID } from "node:crypto";
import { Temporal } from "@js-temporal/polyfill";
import {
  type Agent,
  type ResourceSlots,
  type Tenant,
  addResources,
  availability,
  citizen,
  facility,
  harness,
  post,
  setup,
  start,
  teardown,
  tenant,
} from "./harness";
beforeAll(setup);
afterAll(teardown);
function book(
  agent: Agent,
  facilityId: string,
  begins: string,
  resourceId: string,
) {
  return post(agent, "citizen/bookings", {
    id: randomUUID(),
    facilityId,
    resourceId,
    start: begins,
  });
}
/** A pool whose default resource is the whole pool, with two lanes of `places` each. */
async function pool(context: Tenant, places = 3) {
  const venue = await facility(context);
  const [lane, other] = await addResources(context, venue.id, [
    { name: "Rúa 1", parentId: venue.id, capacity: places },
    { name: "Rúa 2", parentId: venue.id, capacity: places },
  ]);
  return { id: venue.id, lane, other };
}
async function people(context: Tenant, count: number) {
  const agents: Agent[] = [];
  for (let index = 0; index < count; index++)
    agents.push((await citizen(context, `Persoa ${index}`)).agent);
  return agents;
}
async function slot(
  context: Tenant,
  facilityId: string,
  resourceId: string,
  begins: string,
) {
  const resources = (await availability(context, facilityId, begins)).body
    .resources as ResourceSlots[];
  return resources
    .find((resource) => resource.id === resourceId)
    ?.slots.find((value) => value.start === begins);
}
function day(days: number) {
  return Temporal.Now.zonedDateTimeISO("Europe/Madrid")
    .add({ days })
    .toPlainDate();
}
describe("Shared capacity of a court (#95) through HTTP and PostgreSQL", () => {
  it("should let people book places until the lane is full and show the places left", async () => {
    const context = await tenant();
    const { id, lane, other } = await pool(context);
    const begins = start(2, 10);
    expect(await slot(context, id, lane, begins)).toMatchObject({
      status: "available",
      capacity: 3,
      remaining: 3,
    });
    const [first, second, third, fourth] = await people(context, 4);
    await book(first, id, begins, lane).expect(201);
    expect(await slot(context, id, lane, begins)).toMatchObject({
      status: "available",
      remaining: 2,
    });
    await book(second, id, begins, lane).expect(201);
    await book(third, id, begins, lane).expect(201);
    expect(await slot(context, id, lane, begins)).toMatchObject({
      status: "booked",
      remaining: 0,
    });
    const refused = await book(fourth, id, begins, lane).expect(409);
    expect(refused.body.code).toBe("slot_taken");
    // The other lane and the whole pool keep their own state.
    expect(await slot(context, id, other, begins)).toMatchObject({
      status: "available",
      remaining: 3,
    });
    expect((await slot(context, id, id, begins))?.status).toBe("booked");
    expect(await slot(context, id, id, begins)).not.toHaveProperty("capacity");
  });
  it("should never exceed the capacity under concurrent requests", async () => {
    const context = await tenant();
    const { id, lane } = await pool(context);
    const begins = start(3, 11);
    const agents = await people(context, 5);
    const responses = await Promise.all(
      agents.map((agent) => book(agent, id, begins, lane)),
    );
    expect(responses.map((response) => response.status).sort()).toEqual([
      201, 201, 201, 409, 409,
    ]);
    const { rows } = await harness.db.query(
      "SELECT count(*)::int AS count FROM booking_units WHERE tenant_id=$1 AND unit_id=$2 AND shared",
      [context.id, lane],
    );
    expect(rows[0].count).toBe(3);
  });
  it("should refuse a second place for the same person in the same slot", async () => {
    const context = await tenant();
    const { id, lane, other } = await pool(context);
    const begins = start(2, 12);
    await book(context.citizen, id, begins, lane).expect(201);
    const again = await book(context.citizen, id, begins, lane).expect(409);
    expect(again.body.code).toBe("already_booked");
    // A place in another lane is a different booking.
    await book(context.citizen, id, begins, other).expect(201);
  });
  it("should keep places and whole-pool bookings apart", async () => {
    const context = await tenant();
    const { id, lane } = await pool(context);
    const placeFirst = start(2, 10);
    const poolFirst = start(2, 11);
    const [club] = await people(context, 1);
    await book(context.citizen, id, placeFirst, lane).expect(201);
    const whole = await book(club, id, placeFirst, id).expect(409);
    expect(whole.body.code).toBe("slot_taken");
    await book(club, id, poolFirst, id).expect(201);
    expect(await slot(context, id, lane, poolFirst)).toMatchObject({
      status: "booked",
      remaining: 0,
    });
    const place = await book(context.citizen, id, poolFirst, lane).expect(409);
    expect(place.body.code).toBe("slot_taken");
  });
  it("should move a place when a person reschedules into a lane with room", async () => {
    const context = await tenant();
    const { id, lane } = await pool(context, 2);
    const from = start(2, 10);
    const to = start(2, 11);
    const bookingId = randomUUID();
    await post(context.citizen, "citizen/bookings", {
      id: bookingId,
      facilityId: id,
      resourceId: lane,
      start: from,
    }).expect(201);
    const [other] = await people(context, 1);
    await book(other, id, to, lane).expect(201);
    await context.citizen
      .patch(`/v2/citizen/bookings/${bookingId}`)
      .set("X-Quenda-Request", "1")
      .send({ start: to, resourceId: lane })
      .expect(204);
    expect(await slot(context, id, lane, from)).toMatchObject({
      remaining: 2,
    });
    expect(await slot(context, id, lane, to)).toMatchObject({
      status: "booked",
      remaining: 0,
    });
  });
  it("should put a club's season date on a lane with places in conflict", async () => {
    const context = await tenant();
    const { id, lane } = await pool(context);
    const date = day(3);
    const begins = date
      .toZonedDateTime({ timeZone: "Europe/Madrid", plainTime: "19:00" })
      .toInstant()
      .toString();
    await book(context.citizen, id, begins, lane).expect(201);
    const organizationId = (
      await post(context.manager, "manager/organizations", {
        name: "Club Natación Proba",
        taxId: "g15000001",
        sport: "padel",
        contactEmail: "club@example.invalid",
      }).expect(201)
    ).body.id as string;
    const campaignId = (
      await post(context.manager, "manager/season-campaigns", {
        name: "Curso de proba",
        startsOn: day(1).toString(),
        endsOn: day(6).toString(),
        criteria: { gl: "Clubs locais", es: "Clubes locales" },
        facilityIds: [id],
      }).expect(201)
    ).body.id as string;
    const assigned = await post(context.manager, "manager/season-allocations", {
      campaignId,
      organizationId,
      facilityId: id,
      resourceId: lane,
      weekdays: [date.dayOfWeek],
      startsLocal: "19:00",
      endsLocal: "20:00",
      reason: "Escola de natación",
    }).expect(201);
    expect(assigned.body.conflicts).toMatchObject([{ start: begins }]);
  });
  it("should only let a manager raise the capacity of a lane with upcoming places", async () => {
    const context = await tenant();
    const { id, lane, other } = await pool(context);
    await book(context.citizen, id, start(2, 10), lane).expect(201);
    const save = (capacity: number | null) =>
      context.manager
        .put(`/v2/manager/facilities/${id}/resources`)
        .set("X-Quenda-Request", "1")
        .send({
          resources: [
            { id, name: "Piscina", parentId: null, active: true },
            { id: lane, name: "Rúa 1", parentId: id, active: true, capacity },
            {
              id: other,
              name: "Rúa 2",
              parentId: id,
              active: true,
              capacity: 3,
            },
          ],
        });
    for (const capacity of [2, null])
      expect((await save(capacity).expect(409)).body.code).toBe(
        "resource_in_use",
      );
    const saved = await save(5).expect(200);
    expect(
      (saved.body as { id: string; capacity: number | null }[]).find(
        (resource) => resource.id === lane,
      )?.capacity,
    ).toBe(5);
    // Only courts without parts take a capacity.
    await context.manager
      .put(`/v2/manager/facilities/${id}/resources`)
      .set("X-Quenda-Request", "1")
      .send({
        resources: [
          { id, name: "Piscina", parentId: null, active: true, capacity: 10 },
          { id: lane, name: "Rúa 1", parentId: id, active: true, capacity: 5 },
          { id: other, name: "Rúa 2", parentId: id, active: true, capacity: 3 },
        ],
      })
      .expect(400);
  });
});
