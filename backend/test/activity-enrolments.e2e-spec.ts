// SPDX-License-Identifier: AGPL-3.0-or-later
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { randomUUID } from "node:crypto";
import request from "supertest";
import type { Type } from "@nestjs/common";
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
const anonymous = () => request(harness.app.getHttpServer());
function at(date: Temporal.PlainDate, time: string) {
  return date
    .toPlainDateTime(Temporal.PlainTime.from(time))
    .toZonedDateTime(ZONE)
    .toInstant()
    .toString();
}
function put(agent: Agent, path: string, body: unknown) {
  return agent.put(`/v2/${path}`).set("X-Quenda-Request", "1").send(body);
}
const first = () => today().add({ days: 3 });
const second = () => today().add({ days: 5 });
/** An activity for adults, so the people of the test can enrol themselves. */
function activity(
  court: { id: string },
  overrides: Record<string, unknown> = {},
) {
  return {
    facilityId: court.id,
    resourceId: court.id,
    sport: "swimming",
    name: { gl: "Natación para persoas adultas", es: "" },
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
    minAge: 16,
    maxAge: null,
    enrolmentOpensOn: today().toString(),
    enrolmentClosesOn: today().add({ days: 10 }).toString(),
    prices: [{ category: "general", priceCents: 3000 }],
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
  const id = created.body.id as string;
  await post(
    context.manager,
    `manager/activities/${id}/publication`,
    {},
  ).expect(200);
  return id;
}
function enrol(agent: Agent, activityId: string, id = randomUUID()) {
  return post(agent, "citizen/activity-enrolments", { id, activityId });
}
async function people(context: Tenant, count: number) {
  const created = [];
  for (let index = 1; index <= count; index += 1)
    created.push(await citizen(context, `Persoa ${index}`));
  return created;
}
async function messages(context: Tenant, kind: string) {
  const { rows } = await harness.db.query<{
    user_id: string;
    channel: string;
    enrolment_id: string;
  }>(
    "SELECT user_id, channel, enrolment_id FROM outbox WHERE tenant_id=$1 AND kind=$2 ORDER BY created_at",
    [context.id, kind],
  );
  return rows;
}
interface Locator {
  get(type: Type): {
    execute(args: { tenantId: string }): Promise<{
      fold<R>(
        ok: (value: Record<string, unknown>) => R,
        err: (e: unknown) => R,
      ): R;
    }>;
  };
}
// Loaded lazily: the compiled modules read DATABASE_URL, which setup() points at the test database.
function retention() {
  const { Commands } =
    require("../dist/v2/shared/infrastructure/commands.locator.js") as {
      Commands: Type<Locator>;
    };
  const { ApplyRetention } =
    require("../dist/v2/modules/retention/application/commands/apply-retention.command.js") as {
      ApplyRetention: Type;
    };
  return harness.app.get(Commands).get(ApplyRetention);
}
describe("Enrolment in activities", () => {
  it("should give 8 places, queue the 9th person and promote them when someone leaves", async () => {
    const context = await tenant();
    const court = await facility(context);
    const id = await published(context, court);
    const crowd = await people(context, 9);
    for (const person of crowd.slice(0, 8)) {
      const enrolled = await enrol(person.agent, id).expect(201);
      expect(enrolled.body).toMatchObject({
        activityId: id,
        status: "enrolled",
        position: null,
        nextSession: at(first(), "17:00"),
      });
    }
    const full = await anonymous()
      .get(`/v2/public/activities/${id}`)
      .query({ slug: context.slug })
      .expect(200);
    expect(full.body).toMatchObject({
      enrolment: "full",
      freePlaces: 0,
      waiting: 0,
    });
    const ninth = crowd[8]!;
    const waiting = await enrol(ninth.agent, id).expect(201);
    expect(waiting.body).toMatchObject({ status: "waiting", position: 1 });
    await enrol(ninth.agent, id)
      .expect(409)
      .expect((response) =>
        expect(response.body.code).toBe("already_enrolled"),
      );
    const leaving = (
      await crowd[0]!.agent.get("/v2/citizen/activity-enrolments").expect(200)
    ).body[0];
    await del(
      crowd[0]!.agent,
      `citizen/activity-enrolments/${leaving.id}`,
    ).expect(204);
    // Leaving twice changes nothing.
    await del(
      crowd[0]!.agent,
      `citizen/activity-enrolments/${leaving.id}`,
    ).expect(204);
    const mine = (
      await ninth.agent.get("/v2/citizen/activity-enrolments").expect(200)
    ).body;
    expect(mine).toMatchObject([
      { id: waiting.body.id, status: "enrolled", position: null },
    ]);
    const promoted = await messages(context, "enrolment_promoted");
    expect(promoted.map((row) => row.user_id)).toEqual([ninth.id]);
    expect(promoted.every((row) => row.enrolment_id === waiting.body.id)).toBe(
      true,
    );
    const notices = await ninth.agent
      .get("/v2/citizen/notifications")
      .expect(200);
    expect(notices.body.map((notice: { kind: string }) => notice.kind)).toEqual(
      ["enrolment_promoted", "enrolment_waiting"],
    );
    expect(notices.body[0]).toMatchObject({
      bookingId: null,
      activityId: id,
      activityName: { gl: "Natación para persoas adultas" },
      facilityName: court.name,
    });
    const managed = await context.manager
      .get(`/v2/manager/activities/${id}`)
      .expect(200);
    expect(managed.body).toMatchObject({ enrolled: 8, waiting: 0 });
    const audit = await harness.db.query<{ action: string }>(
      "SELECT action FROM audit_events WHERE tenant_id=$1 AND action LIKE 'activity_enrolment.%' ORDER BY occurred_at",
      [context.id],
    );
    expect(audit.rows.map((row) => row.action)).toContain(
      "activity_enrolment.left",
    );
  });
  it("should hand out exactly the places there are when people enrol at once", async () => {
    const context = await tenant();
    const court = await facility(context);
    const id = await published(context, court);
    const crowd = await people(context, 20);
    const responses = await Promise.all(
      crowd.map((person) => enrol(person.agent, id)),
    );
    expect(responses.map((response) => response.status)).toEqual(
      crowd.map(() => 201),
    );
    const statuses = responses.map((response) => response.body.status);
    expect(statuses.filter((status) => status === "enrolled")).toHaveLength(8);
    expect(statuses.filter((status) => status === "waiting")).toHaveLength(12);
    const positions = responses
      .map((response) => response.body.position as number | null)
      .filter((value): value is number => value !== null)
      .sort((a, b) => a - b);
    expect(positions).toEqual(Array.from({ length: 12 }, (_, i) => i + 1));
  });
  it("should only enrol adults while the period is open, and repeat a request with the same id", async () => {
    const context = await tenant();
    const court = await facility(context);
    const children = await published(context, court, { minAge: 6, maxAge: 12 });
    await enrol(context.citizen, children)
      .expect(422)
      .expect((response) => expect(response.body.code).toBe("age_not_allowed"));
    const later = await published(context, court, {
      name: { gl: "Aquaxim", es: "" },
      rule: {
        ...activity(court).rule,
        startsLocal: "19:00",
        endsLocal: "20:00",
      },
      enrolmentOpensOn: today().add({ days: 2 }).toString(),
    });
    await enrol(context.citizen, later)
      .expect(422)
      .expect((response) =>
        expect(response.body.code).toBe("enrolment_closed"),
      );
    const draft = await post(
      context.manager,
      "manager/activities",
      activity(court, {
        rule: {
          ...activity(court).rule,
          startsLocal: "10:00",
          endsLocal: "11:00",
        },
      }),
    ).expect(201);
    await enrol(context.citizen, draft.body.id).expect(404);
    const open = await published(context, court, {
      rule: {
        ...activity(court).rule,
        startsLocal: "12:00",
        endsLocal: "13:00",
      },
    });
    const id = randomUUID();
    const once = await enrol(context.citizen, open, id).expect(201);
    const again = await enrol(context.citizen, open, id).expect(201);
    expect(again.body).toEqual(once.body);
    await enrol(context.citizen, later, id)
      .expect(409)
      .expect((response) => expect(response.body.code).toBe("id_reused"));
    await anonymous().get("/v2/citizen/activity-enrolments").expect(401);
  });
  it("should tell each enrolled person once when a date or the whole activity is cancelled", async () => {
    const context = await tenant();
    const court = await facility(context);
    const id = await published(context, court, { places: 1 });
    const [holder, waiter] = await people(context, 2);
    await enrol(holder!.agent, id).expect(201);
    await enrol(waiter!.agent, id).expect(201);
    const details = await context.manager
      .get(`/v2/manager/activities/${id}`)
      .expect(200);
    const session = (
      details.body.sessions as { id: string; start: string }[]
    ).find((item) => item.start === at(first(), "17:00"))!;
    for (let attempt = 0; attempt < 2; attempt += 1)
      await patch(context.manager, `manager/activity-sessions/${session.id}`, {
        status: "cancelled",
        reason: "Avaría na depuradora",
      }).expect(204);
    // Only the person holding a place is told, once per channel they use.
    const cancelled = await messages(context, "activity_session_cancelled");
    expect(cancelled.map((row) => row.user_id)).toEqual([holder!.id]);
    const notices = (
      await holder!.agent.get("/v2/citizen/notifications").expect(200)
    ).body;
    expect(notices[0]).toMatchObject({
      kind: "activity_session_cancelled",
      details: {
        reason: "Avaría na depuradora",
        dates: [at(first(), "17:00")],
      },
    });
    const mine = (
      await holder!.agent.get("/v2/citizen/activity-enrolments").expect(200)
    ).body;
    expect(mine[0]).toMatchObject({
      cancelledSessions: 1,
      nextSession: at(second(), "17:00"),
    });
    await patch(context.manager, `manager/activities/${id}`, {
      status: "cancelled",
      reason: "Sen monitor",
    }).expect(204);
    const ended = await messages(context, "activity_cancelled");
    expect(new Set(ended.map((row) => row.user_id))).toEqual(
      new Set([holder!.id, waiter!.id]),
    );
    expect(
      (await waiter!.agent.get("/v2/citizen/activity-enrolments").expect(200))
        .body[0],
    ).toMatchObject({ status: "cancelled", activityStatus: "cancelled" });
  });
  it("should tell enrolled people about the dates a facility closure cancels", async () => {
    const context = await tenant();
    const court = await facility(context);
    const id = await published(context, court);
    const [person] = await people(context, 1);
    await enrol(person!.agent, id).expect(201);
    await patch(context.manager, `manager/facilities/${court.id}`, {
      status: "maintenance",
      closureReason: "Baleirado do vaso",
    }).expect(204);
    const notices = (
      await person!.agent.get("/v2/citizen/notifications").expect(200)
    ).body;
    expect(notices[0].kind).toBe("activity_session_cancelled");
    expect(notices[0].details.reason).toBe("Baleirado do vaso");
    expect(notices[0].details.dates.length).toBeGreaterThanOrEqual(4);
    expect(
      (await messages(context, "activity_session_cancelled")).map(
        (row) => row.user_id,
      ),
    ).toEqual([person!.id]);
  });
  it("should let the municipality remove someone with a reason, list people and download them as CSV", async () => {
    const context = await tenant();
    const court = await facility(context);
    const id = await published(context, court, { places: 1 });
    const [ana, berto] = await people(context, 2);
    await enrol(ana!.agent, id).expect(201);
    await enrol(berto!.agent, id).expect(201);
    const page = await context.manager
      .get(`/v2/manager/activities/${id}/enrolments`)
      .expect(200);
    expect(page.body).toMatchObject({ total: 2, page: 1, pageSize: 25 });
    expect(page.body.items).toMatchObject([
      { name: "Persoa 1", status: "enrolled", position: null },
      { name: "Persoa 2", status: "waiting", position: 1 },
    ]);
    const waitingOnly = await context.manager
      .get(`/v2/manager/activities/${id}/enrolments`)
      .query({ status: "waiting" })
      .expect(200);
    expect(waitingOnly.body.items).toHaveLength(1);
    const removedId = page.body.items[0].id as string;
    await patch(context.manager, `manager/activity-enrolments/${removedId}`, {
      status: "removed",
      reason: "",
    }).expect(400);
    await patch(context.manager, `manager/activity-enrolments/${removedId}`, {
      status: "removed",
      reason: "Non presentou o certificado médico",
    }).expect(204);
    expect(
      (await ana!.agent.get("/v2/citizen/notifications").expect(200)).body[0],
    ).toMatchObject({
      kind: "enrolment_removed",
      details: { reason: "Non presentou o certificado médico" },
    });
    expect(
      (await berto!.agent.get("/v2/citizen/activity-enrolments").expect(200))
        .body[0].status,
    ).toBe("enrolled");
    const csv = await context.manager
      .get(`/v2/manager/activities/${id}/enrolments.csv`)
      .expect(200)
      .expect("Content-Type", /text\/csv/);
    expect(csv.text.startsWith("﻿")).toBe(true);
    expect(csv.text).toContain("Estado;Posición na lista de espera;Nome");
    expect(csv.text).toContain("Inscrita;;Persoa 2");
    expect(csv.text).toContain("Non presentou o certificado médico");
    const exported = await harness.db.query(
      "SELECT details FROM audit_events WHERE tenant_id=$1 AND action='activity.enrolments_exported'",
      [context.id],
    );
    expect(exported.rows).toEqual([{ details: { rows: 2 } }]);
    await context.citizen
      .get(`/v2/manager/activities/${id}/enrolments.csv`)
      .expect(403);
    const other = await tenant();
    await other.manager
      .get(`/v2/manager/activities/${id}/enrolments`)
      .expect(404);
    await patch(other.manager, `manager/activity-enrolments/${removedId}`, {
      status: "removed",
      reason: "Non é meu",
    }).expect(404);
  });
  it("should keep places at least at the people enrolled, move people up when they grow and fix the schedule", async () => {
    const context = await tenant();
    const court = await facility(context);
    const id = await published(context, court, { places: 2 });
    const crowd = await people(context, 3);
    for (const person of crowd) await enrol(person.agent, id).expect(201);
    await put(
      context.manager,
      `manager/activities/${id}`,
      activity(court, { places: 1 }),
    )
      .expect(409)
      .expect((response) =>
        expect(response.body.code).toBe("places_below_enrolled"),
      );
    await put(
      context.manager,
      `manager/activities/${id}`,
      activity(court, {
        places: 2,
        rule: {
          ...activity(court).rule,
          startsLocal: "18:00",
          endsLocal: "19:00",
        },
      }),
    )
      .expect(409)
      .expect((response) =>
        expect(response.body.code).toBe("activity_has_enrolments"),
      );
    const grown = await put(
      context.manager,
      `manager/activities/${id}`,
      activity(court, { places: 3, name: { gl: "Natación de mañá", es: "" } }),
    ).expect(200);
    expect(grown.body).toMatchObject({
      places: 3,
      enrolled: 3,
      waiting: 0,
      name: { gl: "Natación de mañá" },
    });
    expect(
      (await messages(context, "enrolment_promoted")).map((row) => row.user_id),
    ).toEqual([crowd[2]!.id]);
  });
  it("should free a deleted account's place, export enrolments and list sessions in the calendar feed", async () => {
    const context = await tenant();
    const court = await facility(context);
    const id = await published(context, court, { places: 1 });
    const [leaver, next] = await people(context, 2);
    await enrol(leaver!.agent, id).expect(201);
    await enrol(next!.agent, id).expect(201);
    const account = await leaver!.agent
      .get("/v2/citizen/me/export")
      .expect(200);
    expect(account.body.activityEnrolments).toMatchObject([
      { activityId: id, status: "enrolled", facilityName: court.name },
    ]);
    const link = await post(next!.agent, "citizen/calendar-feed", {}).expect(
      201,
    );
    await del(leaver!.agent, "citizen/me").expect(204);
    expect(
      (await next!.agent.get("/v2/citizen/activity-enrolments").expect(200))
        .body[0].status,
    ).toBe("enrolled");
    const details = await context.manager
      .get(`/v2/manager/activities/${id}`)
      .expect(200);
    const session = (
      details.body.sessions as { id: string; start: string }[]
    ).find((item) => item.start === at(first(), "17:00"))!;
    await patch(context.manager, `manager/activity-sessions/${session.id}`, {
      status: "cancelled",
      reason: "Avaría",
    }).expect(204);
    const enrolment = (
      await next!.agent.get("/v2/citizen/activity-enrolments").expect(200)
    ).body[0].id as string;
    const feed = await anonymous()
      .get(link.body.path as string)
      .expect(200);
    // Long lines are folded (RFC 5545 §3.1).
    const text = feed.text.replaceAll("\r\n ", "");
    expect(text).toContain(`UID:${session.id}-${enrolment}@quenda`);
    expect(text).toContain("SUMMARY:Natación para persoas adultas (");
    const event = text
      .split("BEGIN:VEVENT")
      .find((block) => block.includes(`UID:${session.id}-`))!;
    expect(event).toContain("STATUS:CANCELLED");
    expect(event).toContain("SEQUENCE:1");
    expect(text).not.toContain("Persoa");
  });
  it("should delete enrolments and their notices with the activity's history once retention ends", async () => {
    const context = await tenant();
    const court = await facility(context);
    const id = await published(context, court);
    const [person] = await people(context, 1);
    await enrol(person!.agent, id).expect(201);
    // Make the activity old enough for the retention policy.
    await harness.db.query(
      "UPDATE activities SET starts_on=starts_on - interval '4 years', ends_on=ends_on - interval '4 years', enrolment_opens_on=enrolment_opens_on - interval '4 years', enrolment_closes_on=enrolment_closes_on - interval '4 years' WHERE id=$1",
      [id],
    );
    const summary = (await retention().execute({ tenantId: context.id })).fold(
      (value) => value,
      (error) => {
        throw new Error(JSON.stringify(error));
      },
    );
    expect(summary.enrolmentsDeleted).toBe(1);
    for (const table of ["activity_enrolments", "notifications", "outbox"]) {
      const { rowCount } = await harness.db.query(
        `SELECT 1 FROM ${table} WHERE tenant_id=$1 AND user_id=$2`,
        [context.id, person!.id],
      );
      expect(rowCount).toBe(0);
    }
  });
});
