// SPDX-License-Identifier: AGPL-3.0-or-later
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { randomUUID } from "node:crypto";
import { Temporal } from "@js-temporal/polyfill";
import {
  type Agent,
  type Tenant,
  citizen,
  del,
  facility,
  harness,
  patch,
  post,
  setup,
  teardown,
  tenant,
} from "./harness";
beforeAll(setup);
afterAll(teardown);
const ZONE = "Europe/Madrid";
const today = () => Temporal.Now.zonedDateTimeISO(ZONE).toPlainDate();
const first = () => today().add({ days: 3 });
const second = () => today().add({ days: 5 });
/** The year the test activities start, which sets the ages counted. */
const startYear = () => today().add({ days: 1 }).year;
const VERSION = "2026-11";
function activity(
  court: { id: string },
  overrides: Record<string, unknown> = {},
) {
  return {
    facilityId: court.id,
    resourceId: court.id,
    sport: "swimming",
    name: { gl: "Natación infantil", es: "" },
    description: { gl: "", es: "" },
    rule: {
      weekdays: [first().dayOfWeek, second().dayOfWeek],
      startsLocal: "17:00",
      endsLocal: "18:00",
      startsOn: today().add({ days: 1 }).toString(),
      endsOn: today().add({ days: 20 }).toString(),
      exceptions: [],
    },
    places: 8,
    minAge: 6,
    maxAge: 12,
    enrolmentOpensOn: today().toString(),
    enrolmentClosesOn: today().add({ days: 10 }).toString(),
    prices: [],
    ...overrides,
  };
}
async function published(
  context: Tenant,
  court: { id: string },
  overrides: Record<string, unknown> = {},
) {
  const created = await post(
    context.manager,
    "manager/activities",
    activity(court, overrides),
  ).expect(201);
  await post(
    context.manager,
    `manager/activities/${created.body.id}/publication`,
    {},
  ).expect(200);
  return created.body.id as string;
}
function addChild(
  agent: Agent,
  firstName: string,
  age: number,
  overrides: Record<string, unknown> = {},
) {
  return post(agent, "citizen/dependants", {
    id: randomUUID(),
    firstName,
    birthYear: startYear() - age,
    declared: true,
    declarationVersion: VERSION,
    ...overrides,
  });
}
function enrol(agent: Agent, activityId: string, dependantId?: string) {
  return post(agent, "citizen/activity-enrolments", {
    id: randomUUID(),
    activityId,
    ...(dependantId ? { dependantId } : {}),
  });
}
describe("People in an adult's care", () => {
  it("should add, correct and remove a child only with the guardianship declaration, up to ten", async () => {
    const context = await tenant();
    await addChild(context.citizen, "Uxía", 9, { declared: false })
      .expect(422)
      .expect((response) =>
        expect(response.body.code).toBe("declaration_required"),
      );
    await addChild(context.citizen, "Uxía", 9, {
      declarationVersion: "old",
    }).expect(422);
    await addChild(context.citizen, " ", 9).expect(400);
    await addChild(context.citizen, "Uxía", -1).expect(400);
    const id = randomUUID();
    const added = await addChild(context.citizen, "  Uxía  ", 9, { id }).expect(
      201,
    );
    expect(added.body).toMatchObject({
      id,
      firstName: "Uxía",
      birthYear: startYear() - 9,
      declarationVersion: VERSION,
    });
    // Repeating the request returns the same person; another adult cannot reuse the id.
    await addChild(context.citizen, "Uxía", 9, { id }).expect(201);
    const other = await citizen(context, "Outra persoa");
    await addChild(other.agent, "Brais", 7, { id })
      .expect(409)
      .expect((response) => expect(response.body.code).toBe("id_reused"));
    await patch(other.agent, `citizen/dependants/${id}`, {
      firstName: "Brais",
      birthYear: 2019,
    }).expect(404);
    const corrected = await patch(context.citizen, `citizen/dependants/${id}`, {
      firstName: "Uxía María",
      birthYear: startYear() - 8,
    }).expect(200);
    expect(corrected.body.firstName).toBe("Uxía María");
    for (let index = 2; index <= 10; index += 1)
      await addChild(context.citizen, `Neno ${index}`, 5).expect(201);
    await addChild(context.citizen, "Once", 5)
      .expect(422)
      .expect((response) => expect(response.body.code).toBe("dependant_limit"));
    const listed = await context.citizen
      .get("/v2/citizen/dependants")
      .expect(200);
    expect(listed.body).toHaveLength(10);
    expect(listed.body[0].firstName).toBe("Uxía María");
    expect(
      (await other.agent.get("/v2/citizen/dependants").expect(200)).body,
    ).toEqual([]);
    await del(context.citizen, `citizen/dependants/${id}`).expect(204);
    const audit = await harness.db.query<{ action: string; details: unknown }>(
      "SELECT action, details FROM audit_events WHERE tenant_id=$1 AND action LIKE 'dependant.%' AND resource_id=$2 ORDER BY occurred_at",
      [context.id, id],
    );
    expect(audit.rows.map((row) => row.action)).toEqual([
      "dependant.added",
      "dependant.updated",
      "dependant.removed",
    ]);
    // The journal does not keep the child's name.
    expect(JSON.stringify(audit.rows)).not.toContain("Uxía");
  });
  it("should enrol a child of the right age and refuse other ages and the adult in a children's activity", async () => {
    const context = await tenant();
    const court = await facility(context);
    const id = await published(context, court);
    const uxia = (await addChild(context.citizen, "Uxía", 9).expect(201)).body;
    const xian = (await addChild(context.citizen, "Xián", 14).expect(201)).body;
    await enrol(context.citizen, id)
      .expect(422)
      .expect((response) => expect(response.body.code).toBe("age_not_allowed"));
    await enrol(context.citizen, id, xian.id)
      .expect(422)
      .expect((response) => expect(response.body.code).toBe("age_not_allowed"));
    const enrolled = await enrol(context.citizen, id, uxia.id).expect(201);
    expect(enrolled.body).toMatchObject({
      status: "enrolled",
      participant: { dependantId: uxia.id, firstName: "Uxía" },
    });
    await enrol(context.citizen, id, uxia.id)
      .expect(409)
      .expect((response) =>
        expect(response.body.code).toBe("already_enrolled"),
      );
    // Someone else's child cannot be enrolled.
    const other = await citizen(context, "Outra persoa");
    await enrol(other.agent, id, uxia.id).expect(404);
    const list = await context.manager
      .get(`/v2/manager/activities/${id}/enrolments`)
      .expect(200);
    expect(list.body.items[0]).toMatchObject({
      name: "citizen",
      participantFirstName: "Uxía",
      participantAge: 9,
      dependantId: uxia.id,
    });
    const csv = await context.manager
      .get(`/v2/manager/activities/${id}/enrolments.csv`)
      .expect(200);
    expect(csv.text).toContain(";Uxía;9;");
    await del(context.citizen, `citizen/dependants/${uxia.id}`)
      .expect(409)
      .expect((response) =>
        expect(response.body.code).toBe("dependant_in_use"),
      );
    await del(
      context.citizen,
      `citizen/activity-enrolments/${enrolled.body.id}`,
    ).expect(204);
    await del(context.citizen, `citizen/dependants/${uxia.id}`).expect(204);
  });
  it("should let an adult and their teenager both hold a place in an activity for ages 16 and over", async () => {
    const context = await tenant();
    const court = await facility(context);
    const id = await published(context, court, {
      name: { gl: "Ximnasia de mantemento", es: "" },
      minAge: 16,
      maxAge: null,
    });
    const teen = (await addChild(context.citizen, "Iria", 17).expect(201)).body;
    await enrol(context.citizen, id).expect(201);
    await enrol(context.citizen, id, teen.id).expect(201);
    const mine = (
      await context.citizen.get("/v2/citizen/activity-enrolments").expect(200)
    ).body;
    expect(
      mine.map((item: { participant: unknown }) => item.participant),
    ).toEqual(
      expect.arrayContaining([
        null,
        { dependantId: teen.id, firstName: "Iria" },
      ]),
    );
  });
  it("should export the people in an adult's care and give their places on when the account is deleted", async () => {
    const context = await tenant();
    const court = await facility(context);
    const id = await published(context, court, { places: 1 });
    const child = (await addChild(context.citizen, "Uxía", 9).expect(201)).body;
    await enrol(context.citizen, id, child.id).expect(201);
    const next = await citizen(context, "Seguinte");
    const nextChild = (await addChild(next.agent, "Brais", 8).expect(201)).body;
    const waiting = await enrol(next.agent, id, nextChild.id).expect(201);
    expect(waiting.body.status).toBe("waiting");
    const exported = await context.citizen
      .get("/v2/citizen/me/export")
      .expect(200);
    expect(exported.body.dependants).toMatchObject([
      { id: child.id, firstName: "Uxía", declarationVersion: VERSION },
    ]);
    expect(exported.body.activityEnrolments[0].dependantId).toBe(child.id);
    await del(context.citizen, "citizen/me").expect(204);
    expect(
      (await next.agent.get("/v2/citizen/activity-enrolments").expect(200))
        .body[0].status,
    ).toBe("enrolled");
    const left = await harness.db.query(
      "SELECT 1 FROM dependants WHERE tenant_id=$1 AND user_id=$2",
      [context.id, context.users.citizen],
    );
    expect(left.rowCount).toBe(0);
  });
});
