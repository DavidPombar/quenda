// SPDX-License-Identifier: AGPL-3.0-or-later
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { randomUUID } from "node:crypto";
import request from "supertest";
import { Temporal } from "@js-temporal/polyfill";
import {
  type Agent,
  type Tenant,
  citizen,
  facility,
  harness,
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
async function accessStaff(context: Tenant) {
  await harness.db.query(
    "INSERT INTO users (id,tenant_id,display_name,role) VALUES ($1,$2,'Brais · control de accesos','access')",
    [randomUUID(), context.id],
  );
  const agent = request.agent(harness.app.getHttpServer());
  await post(agent, "public/sessions", {
    slug: context.slug,
    role: "access",
  }).expect(201);
  return agent;
}
/**
 * A published activity whose first session is moved to now, with an adult and a child in their
 * care holding places. Sessions in the past cannot be planned, so the move is made in SQL.
 */
async function sessionNow(context: Tenant) {
  const court = await facility(context);
  const created = await post(context.manager, "manager/activities", {
    facilityId: court.id,
    resourceId: court.id,
    sport: "swimming",
    name: { gl: "Natación en familia", es: "" },
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
    minAge: null,
    maxAge: null,
    enrolmentOpensOn: today().toString(),
    enrolmentClosesOn: today().add({ days: 10 }).toString(),
    prices: [],
  }).expect(201);
  const activityId = created.body.id as string;
  const published = await post(
    context.manager,
    `manager/activities/${activityId}/publication`,
    {},
  ).expect(200);
  const sessionId = (published.body.sessions as { id: string }[])[0]!.id;
  const adult = await citizen(context, "Antía Souto");
  const child = await post(adult.agent, "citizen/dependants", {
    id: randomUUID(),
    firstName: "Uxía",
    birthYear: today().year - 9,
    declared: true,
    declarationVersion: "2026-11",
  }).expect(201);
  const own = await post(adult.agent, "citizen/activity-enrolments", {
    id: randomUUID(),
    activityId,
  }).expect(201);
  const childs = await post(adult.agent, "citizen/activity-enrolments", {
    id: randomUUID(),
    activityId,
    dependantId: child.body.id,
  }).expect(201);
  const now = Temporal.Now.instant();
  await harness.db.query(
    "UPDATE activity_sessions SET starts_at=$3, ends_at=$4 WHERE tenant_id=$1 AND id=$2",
    [
      context.id,
      sessionId,
      now.subtract({ minutes: 30 }).toString(),
      now.add({ minutes: 30 }).toString(),
    ],
  );
  return {
    activityId,
    sessionId,
    adult: own.body.id as string,
    child: childs.body.id as string,
  };
}
function mark(
  agent: Agent,
  items: {
    sessionId: string;
    enrolmentId: string;
    status: "present" | "absent";
    recordedAt?: string;
  }[],
) {
  return post(agent, "access/attendance", {
    items: items.map((item) => ({
      recordedAt: Temporal.Now.instant().toString(),
      ...item,
    })),
  });
}
describe("Attendance at activity sessions", () => {
  it("should carry today's sessions with first names in the gate's day and record the roll, latest mark winning", async () => {
    const context = await tenant();
    const gate = await accessStaff(context);
    const { sessionId, adult, child } = await sessionNow(context);
    const day = await gate.get("/v2/access/day").expect(200);
    const session = (
      day.body.sessions as {
        id: string;
        people: { enrolmentId: string; name: string; attendance: unknown }[];
      }[]
    ).find((item) => item.id === sessionId)!;
    expect(session).toMatchObject({
      activityName: { gl: "Natación en familia" },
    });
    expect(session.people).toEqual(
      expect.arrayContaining([
        { enrolmentId: adult, name: "Antía", attendance: null },
        { enrolmentId: child, name: "Uxía", attendance: null },
      ]),
    );
    // No surname nor email travels to the gate.
    expect(JSON.stringify(day.body.sessions)).not.toContain("Souto");
    const at = Temporal.Now.instant();
    const first = await mark(gate, [
      {
        sessionId,
        enrolmentId: adult,
        status: "present",
        recordedAt: at.toString(),
      },
      {
        sessionId,
        enrolmentId: child,
        status: "absent",
        recordedAt: at.toString(),
      },
    ]).expect(200);
    expect(
      first.body.results.map((item: { outcome: string }) => item.outcome),
    ).toEqual(["recorded", "recorded"]);
    // The same batch again (an offline retry) changes nothing; an older mark loses.
    await mark(gate, [
      {
        sessionId,
        enrolmentId: adult,
        status: "present",
        recordedAt: at.toString(),
      },
    ]).expect(200);
    const older = await mark(gate, [
      {
        sessionId,
        enrolmentId: child,
        status: "present",
        recordedAt: at.subtract({ minutes: 5 }).toString(),
      },
    ]).expect(200);
    expect(older.body.results[0].outcome).toBe("stale");
    const later = await mark(gate, [
      {
        sessionId,
        enrolmentId: child,
        status: "present",
        recordedAt: at.add({ seconds: 30 }).toString(),
      },
    ]).expect(200);
    expect(later.body.results[0].outcome).toBe("recorded");
    const stored = await harness.db.query<{ status: string }>(
      "SELECT status FROM activity_attendance WHERE tenant_id=$1 AND session_id=$2 ORDER BY enrolment_id",
      [context.id, sessionId],
    );
    expect(stored.rows.map((row) => row.status)).toEqual([
      "present",
      "present",
    ]);
    const again = await gate.get("/v2/access/day").expect(200);
    expect(
      (
        again.body.sessions as {
          id: string;
          people: { attendance: string }[];
        }[]
      )
        .find((item) => item.id === sessionId)!
        .people.map((person) => person.attendance),
    ).toEqual(["present", "present"]);
  });
  it("should refuse marks outside the session's day, for people not enrolled and from other municipalities", async () => {
    const context = await tenant();
    const gate = await accessStaff(context);
    const { sessionId, adult } = await sessionNow(context);
    const yesterday = Temporal.Now.instant().subtract({ hours: 30 }).toString();
    const refused = await mark(gate, [
      {
        sessionId,
        enrolmentId: adult,
        status: "present",
        recordedAt: yesterday,
      },
      { sessionId, enrolmentId: randomUUID(), status: "present" },
      { sessionId: randomUUID(), enrolmentId: adult, status: "present" },
    ]).expect(200);
    expect(
      refused.body.results.map((item: { outcome: string }) => item.outcome),
    ).toEqual(["out_of_window", "not_enrolled", "not_found"]);
    const other = await tenant();
    const otherGate = await accessStaff(other);
    const foreign = await mark(otherGate, [
      { sessionId, enrolmentId: adult, status: "present" },
    ]).expect(200);
    expect(foreign.body.results[0].outcome).toBe("not_found");
    await mark(context.citizen, [
      { sessionId, enrolmentId: adult, status: "present" },
    ]).expect(403);
  });
  it("should report places, enrolment and attendance per activity in the indicators, and the count in open data", async () => {
    const context = await tenant();
    const gate = await accessStaff(context);
    const { activityId, sessionId, adult, child } = await sessionNow(context);
    await mark(gate, [
      { sessionId, enrolmentId: adult, status: "present" },
      { sessionId, enrolmentId: child, status: "absent" },
    ]).expect(200);
    const range = { from: today().toString(), to: today().toString() };
    const insights = await context.manager
      .get("/v2/manager/insights")
      .query(range)
      .expect(200);
    expect(insights.body.activities).toEqual([
      expect.objectContaining({
        id: activityId,
        name: "Natación en familia",
        places: 8,
        enrolled: 2,
        waiting: 0,
        sessions: 1,
        present: 1,
        absent: 1,
        attendanceRate: 50,
      }),
    ]);
    const csv = await context.manager
      .get("/v2/manager/insights/export")
      .query(range)
      .expect(200);
    expect(csv.text).toContain("Actividade;Instalación;Prazas;Inscritas");
    expect(csv.text).toContain("Natación en familia;");
    const open = await request(harness.app.getHttpServer())
      .get("/v2/public/open-data/activities.json")
      .query({ slug: context.slug })
      .expect(200);
    expect(JSON.stringify(open.body)).toContain(
      '"maximumAttendeeCapacity":8,"remainingAttendeeCapacity":6',
    );
    const csvOpen = await request(harness.app.getHttpServer())
      .get("/v2/public/open-data/activities.csv")
      .query({ slug: context.slug })
      .expect(200);
    expect(csvOpen.text.split("\r\n")[0]).toContain(",places,enrolled,");
    expect(csvOpen.text).not.toContain("Antía");
  });
});
