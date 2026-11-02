// SPDX-License-Identifier: AGPL-3.0-or-later
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { randomUUID } from "node:crypto";
import request from "supertest";
import Ajv2020 from "ajv/dist/2020";
import addFormats from "ajv-formats";
import { Temporal } from "@js-temporal/polyfill";
import {
  type Agent,
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
const anonymous = () => request(harness.app.getHttpServer());
/** Instant of a local date and time in the test municipality. */
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
// Two weekdays three and five days ahead, so both have sessions in the first week.
const first = () => today().add({ days: 3 });
const second = () => today().add({ days: 5 });
function activity(
  court: { id: string },
  overrides: Record<string, unknown> = {},
  rule: Record<string, unknown> = {},
) {
  return {
    facilityId: court.id,
    resourceId: court.id,
    sport: "swimming",
    name: { gl: "Natación infantil", es: "Natación infantil" },
    description: { gl: "Iniciación para nenas e nenos.", es: "" },
    rule: {
      weekdays: [first().dayOfWeek, second().dayOfWeek],
      startsLocal: "17:00",
      endsLocal: "18:00",
      startsOn: today().add({ days: 1 }).toString(),
      endsOn: today().add({ days: 20 }).toString(),
      exceptions: [],
      ...rule,
    },
    places: 8,
    minAge: 6,
    maxAge: 12,
    enrolmentOpensOn: today().toString(),
    enrolmentClosesOn: today().add({ days: 10 }).toString(),
    prices: [{ category: "general", priceCents: 3000 }],
    ...overrides,
  };
}
async function published(context: Tenant, court: { id: string }) {
  const created = await post(
    context.manager,
    "manager/activities",
    activity(court),
  ).expect(201);
  const id = created.body.id as string;
  await post(context.manager, `manager/activities/${id}/publication`, {}).expect(
    200,
  );
  return id;
}
describe("Activities and sports schools", () => {
  it("should hold the lane for every session once published and list it in the catalogue", async () => {
    const context = await tenant();
    const court = await facility(context);
    const draft = await post(
      context.manager,
      "manager/activities",
      activity(court),
    ).expect(201);
    expect(draft.body).toMatchObject({
      status: "draft",
      places: 8,
      rule: { startsLocal: "17:00", exceptions: [] },
      prices: [{ category: "general", priceCents: 3000 }],
      upcomingSessions: 0,
    });
    expect(draft.body.schedule).toContain("RRULE:FREQ=WEEKLY;BYDAY=");
    // A draft does not hold the lane nor appear in the catalogue.
    expect(await slotStatus(context, court.id, at(first(), "17:00"))).toBe(
      "available",
    );
    const listed = () =>
      anonymous()
        .get("/v2/public/activities")
        .query({ slug: context.slug })
        .expect(200);
    expect((await listed()).body).toMatchObject({ items: [], total: 0 });
    await anonymous()
      .get(`/v2/public/activities/${draft.body.id}`)
      .query({ slug: context.slug })
      .expect(404);
    const publication = await post(
      context.manager,
      `manager/activities/${draft.body.id}/publication`,
      {},
    ).expect(200);
    expect(publication.body.status).toBe("published");
    expect(publication.body.upcomingSessions).toBeGreaterThanOrEqual(4);
    expect(publication.body.nextSession).toBe(at(first(), "17:00"));
    expect(await slotStatus(context, court.id, at(first(), "17:00"))).toBe(
      "activity",
    );
    expect(await slotStatus(context, court.id, at(first(), "18:00"))).toBe(
      "available",
    );
    const refused = await post(context.citizen, "citizen/bookings", {
      id: randomUUID(),
      facilityId: court.id,
      start: at(second(), "17:00"),
    }).expect(409);
    expect(refused.body.code).toBe("slot_taken");
    const page = (await listed()).body;
    expect(page).toMatchObject({ total: 1, page: 1, pageSize: 12 });
    expect(page.items[0]).toMatchObject({
      id: draft.body.id,
      facilityName: court.name,
      sport: "swimming",
      sportName: { gl: "Natación" },
      enrolment: "open",
      minAge: 6,
      maxAge: 12,
    });
    expect(page.items[0]).not.toHaveProperty("schedule");
    for (const [query, total] of [
      [{ age: 9 }, 1],
      [{ age: 15 }, 0],
      [{ sport: "padel" }, 0],
      [{ facility: court.id, open: "true" }, 1],
      [{ facility: randomUUID() }, 0],
    ] as const)
      expect(
        (
          await anonymous()
            .get("/v2/public/activities")
            .query({ slug: context.slug, ...query })
            .expect(200)
        ).body.total,
      ).toBe(total);
    const details = await anonymous()
      .get(`/v2/public/activities/${draft.body.id}`)
      .query({ slug: context.slug })
      .expect(200);
    expect(details.body.sessions[0]).toMatchObject({
      start: at(first(), "17:00"),
      end: at(first(), "18:00"),
      status: "active",
    });
    const actions = (
      await harness.db.query<{ action: string }>(
        "SELECT action FROM audit_events WHERE tenant_id=$1 ORDER BY occurred_at",
        [context.id],
      )
    ).rows.map((row) => row.action);
    expect(actions).toEqual(
      expect.arrayContaining(["activity.created", "activity.published"]),
    );
  });
  it("should not save sessions that clash, and list their dates so they become exceptions", async () => {
    const context = await tenant();
    const court = await facility(context);
    await post(context.citizen, "citizen/bookings", {
      id: randomUUID(),
      facilityId: court.id,
      start: at(second(), "17:00"),
    }).expect(201);
    const clash = await post(
      context.manager,
      "manager/activities",
      activity(court),
    ).expect(409);
    expect(clash.body).toMatchObject({
      code: "activity_conflict",
      clashes: [
        {
          date: second().toString(),
          start: at(second(), "17:00"),
          reason: "booking",
        },
      ],
    });
    // Nothing about who booked is disclosed.
    expect(JSON.stringify(clash.body)).not.toContain("citizen");
    const closed = await post(
      context.manager,
      "manager/activities",
      activity(court, {}, { startsLocal: "07:00", endsLocal: "08:00" }),
    ).expect(409);
    expect(closed.body.clashes[0]).toMatchObject({ reason: "closed" });
    const saved = await post(
      context.manager,
      "manager/activities",
      activity(court, {}, { exceptions: [second().toString()] }),
    ).expect(201);
    expect(saved.body.rule.exceptions).toEqual([second().toString()]);
    expect(saved.body.schedule).toContain(
      `EXDATE;TZID=${ZONE}:${second().toString().replaceAll("-", "")}T170000`,
    );
    // Another activity cannot take the lane at the same time once the first is published.
    await post(
      context.manager,
      `manager/activities/${saved.body.id}/publication`,
      {},
    ).expect(200);
    const overlap = await post(
      context.manager,
      "manager/activities",
      activity(court, {}, { exceptions: [second().toString()] }),
    ).expect(409);
    expect(overlap.body.clashes[0]).toMatchObject({ reason: "activity" });
    // Its own sessions never clash with an edit of the same activity.
    const edited = await put(
      context.manager,
      `manager/activities/${saved.body.id}`,
      activity(
        court,
        { places: 10 },
        { exceptions: [second().toString()], startsLocal: "16:00", endsLocal: "17:00" },
      ),
    ).expect(200);
    expect(edited.body).toMatchObject({ places: 10, status: "published" });
    expect(await slotStatus(context, court.id, at(first(), "16:00"))).toBe(
      "activity",
    );
    expect(await slotStatus(context, court.id, at(first(), "17:00"))).toBe(
      "available",
    );
  });
  it("should reject incoherent activities", async () => {
    const context = await tenant();
    const court = await facility(context);
    for (const body of [
      activity(court, { minAge: 12, maxAge: 6 }),
      activity(court, {
        enrolmentClosesOn: today().add({ days: 30 }).toString(),
      }),
      activity(court, { sport: "curling" }),
      activity(court, { prices: [{ category: "senior", priceCents: 10 }] }),
      activity(court, { name: { gl: " ", es: "" } }),
      activity(court, {}, { endsOn: today().toString() }),
    ])
      await post(context.manager, "manager/activities", body).expect(400);
    await post(context.manager, "manager/activities", {
      ...activity(court),
      resourceId: randomUUID(),
    }).expect(404);
    await post(context.citizen, "manager/activities", activity(court)).expect(
      403,
    );
  });
  it("should free the lane when a session or the whole activity is cancelled", async () => {
    const context = await tenant();
    const court = await facility(context);
    const id = await published(context, court);
    const details = await context.manager
      .get(`/v2/manager/activities/${id}`)
      .expect(200);
    const session = (
      details.body.sessions as { id: string; start: string }[]
    ).find((item) => item.start === at(first(), "17:00"))!;
    await patch(context.manager, `manager/activity-sessions/${session.id}`, {
      status: "cancelled",
      reason: "",
    }).expect(400);
    await patch(context.manager, `manager/activity-sessions/${session.id}`, {
      status: "cancelled",
      reason: "Avaría na depuradora",
    }).expect(204);
    expect(await slotStatus(context, court.id, at(first(), "17:00"))).toBe(
      "available",
    );
    expect(await slotStatus(context, court.id, at(second(), "17:00"))).toBe(
      "activity",
    );
    const publicDetails = await anonymous()
      .get(`/v2/public/activities/${id}`)
      .query({ slug: context.slug })
      .expect(200);
    expect(publicDetails.body.sessions[0]).toMatchObject({
      status: "cancelled",
      cancellationReason: "Avaría na depuradora",
    });
    await patch(context.manager, `manager/activities/${id}`, {
      status: "cancelled",
      reason: "Sen monitor",
    }).expect(204);
    expect(await slotStatus(context, court.id, at(second(), "17:00"))).toBe(
      "available",
    );
    expect(
      (
        await anonymous()
          .get("/v2/public/activities")
          .query({ slug: context.slug })
          .expect(200)
      ).body.total,
    ).toBe(0);
    const withdrawn = await anonymous()
      .get(`/v2/public/activities/${id}`)
      .query({ slug: context.slug })
      .expect(200);
    expect(withdrawn.body).toMatchObject({
      status: "cancelled",
      enrolment: "closed",
    });
    await put(context.manager, `manager/activities/${id}`, activity(court))
      .expect(409)
      .expect((response) =>
        expect(response.body.code).toBe("activity_not_editable"),
      );
  });
  it("should cancel the sessions when the facility closes, with the closure reason", async () => {
    const context = await tenant();
    const court = await facility(context);
    const id = await published(context, court);
    const impact = await context.manager
      .get(`/v2/manager/facilities/${court.id}/impact`)
      .expect(200);
    expect(impact.body.sessions).toBeGreaterThanOrEqual(4);
    await patch(context.manager, `manager/facilities/${court.id}`, {
      status: "maintenance",
    }).expect(409);
    await patch(context.manager, `manager/facilities/${court.id}`, {
      status: "maintenance",
      closureReason: "Baleirado do vaso",
    }).expect(204);
    const details = await context.manager
      .get(`/v2/manager/activities/${id}`)
      .expect(200);
    expect(details.body.upcomingSessions).toBe(0);
    for (const session of details.body.sessions as {
      status: string;
      cancellationReason: string;
    }[])
      expect(session).toMatchObject({
        status: "cancelled",
        cancellationReason: "Baleirado do vaso",
      });
    const units = await harness.db.query(
      "SELECT 1 FROM booking_units WHERE tenant_id=$1 AND session_id IS NOT NULL",
      [context.id],
    );
    expect(units.rowCount).toBe(0);
  });
  it("should keep each municipality's activities apart", async () => {
    const context = await tenant();
    const other = await tenant();
    const court = await facility(context);
    const id = await published(context, court);
    await other.manager.get(`/v2/manager/activities/${id}`).expect(404);
    expect(
      (await other.manager.get("/v2/manager/activities").expect(200)).body,
    ).toEqual([]);
    await patch(other.manager, `manager/activities/${id}`, {
      status: "cancelled",
      reason: "Non é meu",
    }).expect(404);
    await anonymous()
      .get(`/v2/public/activities/${id}`)
      .query({ slug: other.slug })
      .expect(404);
    // A facility of another municipality cannot host the activity either.
    await post(other.manager, "manager/activities", activity(court)).expect(
      404,
    );
  });
  it("should publish the current offer as open data that validates against its schemas", async () => {
    const context = await tenant();
    const court = await facility(context);
    const id = await published(context, court);
    await post(context.manager, "manager/activities", {
      ...activity(court),
      name: { gl: "Borrador sen publicar", es: "" },
      rule: { ...activity(court).rule, startsLocal: "19:00", endsLocal: "20:00" },
    }).expect(201);
    const text = (file: string) =>
      anonymous()
        .get(`/v2/public/open-data/${file}`)
        .query({ slug: context.slug })
        .buffer(true)
        .parse((response, callback) => {
          let body = "";
          response.setEncoding("utf8");
          response.on("data", (chunk: string) => (body += chunk));
          response.on("end", () => callback(null, body));
        })
        .expect(200);
    const schema = async (name: string) =>
      (await anonymous().get(`/v2/public/open-data/schemas/${name}`).expect(200))
        .body as object;
    const ajv = new Ajv2020({ strict: false });
    addFormats(ajv);
    const json = JSON.parse((await text("activities.json")).body as string);
    const validate = ajv.compile(await schema("activities.schema.json"));
    expect(validate(json), JSON.stringify(validate.errors)).toBe(true);
    expect(json.numberOfItems).toBe(1);
    expect(json.itemListElement[0].item).toMatchObject({
      "@type": "EventSeries",
      identifier: id,
      name: "Natación infantil",
      maximumAttendeeCapacity: 8,
      typicalAgeRange: "6-12",
      offers: { price: 30, priceCurrency: "EUR" },
      eventSchedule: { startTime: "17:00", repeatFrequency: "P1W" },
    });
    const csv = (await text("activities.csv")).body as string;
    const [header, row, ...rest] = csv.trimEnd().split("\r\n");
    expect(rest).toEqual([]);
    expect(header).toBe(
      "id,name,sport,facility_id,facility_name,court,weekdays,starts_local,ends_local,starts_on,ends_on,exceptions,rrule,places,min_age,max_age,enrolment_opens_on,enrolment_closes_on,price_eur,url",
    );
    expect(row).toContain(`${id},Natación infantil,swimming,`);
    expect(row).toContain("FREQ=WEEKLY;BYDAY=");
    expect(row).toContain(`/app/${context.slug}/actividades/${id}`);
    const catalog = (await text("catalog.jsonld")).body as string;
    expect(catalog).toContain("activities.csv");
    expect(catalog).toContain("activities.tableschema.json");
  });
});
