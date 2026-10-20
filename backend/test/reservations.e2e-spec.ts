// SPDX-License-Identifier: AGPL-3.0-or-later
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { randomUUID } from "node:crypto";
import { createRequire } from "node:module";
import { Pool } from "pg";
import request from "supertest";
import type { INestApplication } from "@nestjs/common";
import { Temporal } from "@js-temporal/polyfill";
import { openingCalendar } from "../src/database/seed";
import { migrate } from "../src/database/migrate";
const require = createRequire(import.meta.url);
const databaseName = `quenda_test_${randomUUID().replaceAll("-", "")}`;
const baseUrl =
  process.env.TEST_DATABASE_URL ??
  "postgres://quenda:quenda_local@127.0.0.1:55432/quenda";
const testUrl = new URL(baseUrl);
testUrl.pathname = `/${databaseName}`;
let app: INestApplication;
let db: Pool;
let admin: Pool;
type Agent = ReturnType<typeof request.agent>;
function post(agent: Agent, path: string, body: unknown) {
  return agent.post(`/v2/${path}`).set("X-Quenda-Request", "1").send(body);
}
function patch(agent: Agent, path: string, body: unknown) {
  return agent.patch(`/v2/${path}`).set("X-Quenda-Request", "1").send(body);
}
function start(days = 2, hour = 10) {
  return Temporal.Now.zonedDateTimeISO("Europe/Madrid")
    .add({ days })
    .toPlainDate()
    .toZonedDateTime({
      timeZone: "Europe/Madrid",
      plainTime: `${String(hour).padStart(2, "0")}:00`,
    })
    .toInstant()
    .toString();
}
// Municipality installation and demo accounts are bootstrap configuration, not API-owned resources.
async function tenant() {
  const id = randomUUID();
  const slug = `test-${id}`;
  await db.query(
    "INSERT INTO municipalities VALUES ($1,$2,$3,$4,$5,14,2,5,$6,$7)",
    [
      id,
      slug,
      "Test municipality",
      "Europe/Madrid",
      "gl",
      "test@example.invalid",
      "Synthetic test data",
    ],
  );
  for (const role of ["citizen", "manager"])
    await db.query("INSERT INTO users VALUES ($1,$2,$3,$4)", [
      randomUUID(),
      id,
      role,
      role,
    ]);
  const citizen = request.agent(app.getHttpServer());
  const manager = request.agent(app.getHttpServer());
  await post(citizen, "public/sessions", { slug, role: "citizen" }).expect(201);
  await post(manager, "public/sessions", { slug, role: "manager" }).expect(201);
  return { id, slug, citizen, manager };
}
async function facility(
  context: Awaited<ReturnType<typeof tenant>>,
  calendar?: string,
) {
  const id = randomUUID();
  const body = {
    id,
    name: `Court ${id}`,
    sport: "padel",
    address: "Test street",
    description: "Test facility",
    accessible: true,
    status: "active",
    slotMinutes: 60,
    priceCents: 0,
    openingCalendar: calendar ?? openingCalendar(id),
    rules: "Sports shoes required",
  };
  await post(context.manager, "manager/facilities", body).expect(201);
  return body;
}
async function availability(
  context: Awaited<ReturnType<typeof tenant>>,
  id: string,
  instant: string,
) {
  const date = Temporal.Instant.from(instant)
    .toZonedDateTimeISO("Europe/Madrid")
    .toPlainDate()
    .toString();
  return request(app.getHttpServer())
    .get(`/v2/public/availability/${id}`)
    .query({ slug: context.slug, date })
    .expect(200);
}
beforeAll(async () => {
  process.env.NODE_ENV = "test";
  process.env.DEMO_MODE = "true";
  // Every test opens fresh sessions from one loopback client.
  process.env.SESSION_RATE_LIMIT_PER_MINUTE = "1000";
  process.env.DATABASE_URL = testUrl.toString();
  admin = new Pool({ connectionString: baseUrl });
  await admin.query(`CREATE DATABASE "${databaseName}"`);
  db = new Pool({ connectionString: testUrl.toString() });
  await migrate(testUrl.toString(), () => undefined);
  const { createApp } = require("../dist/bootstrap.js") as {
    createApp: () => Promise<INestApplication>;
  };
  app = await createApp();
  await app.listen(0, "127.0.0.1");
});
afterAll(async () => {
  if (app) await app.close();
  if (db) await db.end();
  if (admin) {
    await admin.query(`DROP DATABASE IF EXISTS "${databaseName}"`);
    await admin.end();
  }
});
describe("Municipal reservations through HTTP and PostgreSQL", () => {
  it("should expose public availability and reject protected or malformed requests when signed out", async () => {
    const context = await tenant();
    const court = await facility(context);
    const anonymous = request(app.getHttpServer());
    const municipalities = await anonymous
      .get("/v2/public/municipalities")
      .expect(200);
    expect(
      municipalities.body.some(
        (item: { id: string }) => item.id === context.id,
      ),
    ).toBe(true);
    expect(
      (await anonymous.get("/v2/public/session").expect(200)).body.session,
    ).toBe(null);
    expect(
      (
        await anonymous
          .get("/v2/public/facilities")
          .query({ slug: context.slug })
          .expect(200)
      ).body[0].id,
    ).toBe(court.id);
    await anonymous.get("/v2/citizen/bookings").expect(401);
    await anonymous.get("/v2/manager/insights").expect(401);
    await anonymous
      .get("/v2/public/availability/invalid")
      .query({ slug: context.slug, date: "2026-01-01" })
      .expect(400);
    await anonymous
      .get("/v2/public/facilities")
      .query({ slug: "missing" })
      .expect(404);
    await post(context.citizen, "citizen/bookings", {
      id: randomUUID(),
      facilityId: court.id,
      start: start(),
      tenantId: context.id,
    }).expect(400);
    await context.citizen.post("/v2/citizen/bookings").send({}).expect(403);
  });
  it("should commit only one reservation and one notice when two people claim the same slot concurrently", async () => {
    const context = await tenant();
    const court = await facility(context);
    const begins = start();
    const results = await Promise.all([
      post(context.citizen, "citizen/bookings", {
        id: randomUUID(),
        facilityId: court.id,
        start: begins,
      }),
      post(context.manager, "citizen/bookings", {
        id: randomUUID(),
        facilityId: court.id,
        start: begins,
      }),
    ]);
    expect(results.map((result) => result.status).sort()).toEqual([201, 409]);
    expect(
      (await availability(context, court.id, begins)).body.find(
        (slot: { start: string }) => slot.start === begins,
      ).status,
    ).toBe("booked");
    const noticeCount = await db.query(
      "SELECT count(*)::int AS count FROM notifications WHERE tenant_id=$1",
      [context.id],
    );
    expect(noticeCount.rows[0].count).toBe(1);
    const bookings = await db.query(
      "SELECT count(*)::int AS count FROM bookings WHERE tenant_id=$1",
      [context.id],
    );
    expect(bookings.rows[0].count).toBe(1);
  });
  it("should preserve history and release availability when a reservation is moved and then cancelled", async () => {
    const context = await tenant();
    const court = await facility(context);
    const id = randomUUID();
    const begins = start();
    const later = start(3, 11);
    const body = { id, facilityId: court.id, start: begins };
    await post(context.citizen, "citizen/bookings", body).expect(201);
    await post(context.citizen, "citizen/bookings", body).expect(201);
    await post(context.citizen, "citizen/bookings", {
      ...body,
      start: later,
    }).expect(409);
    await patch(context.citizen, `citizen/bookings/${id}`, {
      start: later,
    }).expect(204);
    expect(
      (await availability(context, court.id, begins)).body.find(
        (slot: { start: string }) => slot.start === begins,
      ).status,
    ).toBe("available");
    await patch(context.citizen, `citizen/bookings/${id}`, {
      status: "cancelled",
    }).expect(204);
    await patch(context.citizen, `citizen/bookings/${id}`, {
      status: "cancelled",
    }).expect(204);
    await patch(context.citizen, `citizen/bookings/${id}`, {}).expect(204);
    const history = await context.citizen
      .get("/v2/citizen/bookings")
      .expect(200);
    expect(history.body[0]).toMatchObject({
      id,
      status: "cancelled",
      start: later,
      facilityName: court.name,
    });
    const notices = await context.citizen
      .get("/v2/citizen/notifications")
      .expect(200);
    expect(
      notices.body.map((item: { kind: string }) => item.kind).sort(),
    ).toEqual(["cancelled", "confirmed", "rescheduled"]);
    expect(
      (await availability(context, court.id, later)).body.find(
        (slot: { start: string }) => slot.start === later,
      ).status,
    ).toBe("available");
  });
  it("should conceal other municipalities and people when an authenticated user supplies their resource IDs", async () => {
    const a = await tenant();
    const b = await tenant();
    const court = await facility(a);
    const id = randomUUID();
    await post(a.citizen, "citizen/bookings", {
      id,
      facilityId: court.id,
      start: start(),
    }).expect(201);
    await patch(b.manager, `manager/facilities/${court.id}`, {
      name: "Hijacked",
    }).expect(404);
    await post(b.citizen, "citizen/bookings", {
      id: randomUUID(),
      facilityId: court.id,
      start: start(),
    }).expect(404);
    await patch(b.citizen, `citizen/bookings/${id}`, {
      status: "cancelled",
    }).expect(404);
    await patch(a.manager, `citizen/bookings/${id}`, {
      status: "cancelled",
    }).expect(404);
    await patch(a.citizen, `manager/facilities/${court.id}`, {
      name: "Forbidden",
    }).expect(403);
    await a.citizen.get("/v2/manager/insights").expect(403);
    expect(
      (await b.citizen.get("/v2/citizen/bookings").expect(200)).body,
    ).toEqual([]);
    expect(
      (await b.manager.get("/v2/manager/insights").expect(200)).body.confirmed,
    ).toBe(0);
  });
  it("should reject invalid windows, off-grid times and excess bookings when reservation rules apply", async () => {
    const context = await tenant();
    const court = await facility(context);
    for (const [begins, code] of [
      [start(2, 7), "outside_opening"],
      [
        Temporal.Instant.from(start()).add({ minutes: 15 }).toString(),
        "outside_opening",
      ],
      [start(16), "booking_window"],
      [start(-1), "booking_window"],
      ["invalid", "validation"],
    ] as const) {
      const response = await post(context.citizen, "citizen/bookings", {
        id: randomUUID(),
        facilityId: court.id,
        start: begins,
      });
      expect(response.body.code).toBe(code);
    }
    for (let i = 0; i < 5; i++)
      await post(context.citizen, "citizen/bookings", {
        id: randomUUID(),
        facilityId: court.id,
        start: start(i + 1),
      }).expect(201);
    expect(
      (
        await post(context.citizen, "citizen/bookings", {
          id: randomUUID(),
          facilityId: court.id,
          start: start(7),
        }).expect(422)
      ).body.code,
    ).toBe("booking_limit");
  });
  it("should reject schedule changes with future reservations and allow safe edits when a manager maintains a facility", async () => {
    const context = await tenant();
    const court = await facility(context);
    const id = randomUUID();
    await patch(context.manager, `manager/facilities/${court.id}`, {}).expect(
      204,
    );
    await patch(context.manager, `manager/facilities/${court.id}`, {
      name: "Updated court",
    }).expect(204);
    await patch(context.manager, `manager/facilities/${court.id}`, {
      name: null,
    }).expect(400);
    await patch(context.manager, `manager/facilities/${court.id}`, {
      openingCalendar: "bad-calendar",
    }).expect(400);
    await post(context.citizen, "citizen/bookings", {
      id,
      facilityId: court.id,
      start: start(),
    }).expect(201);
    expect(
      (
        await patch(context.manager, `manager/facilities/${court.id}`, {
          status: "maintenance",
        }).expect(409)
      ).body.code,
    ).toBe("calendar_in_use");
    const stats = await context.manager.get("/v2/manager/insights").expect(200);
    expect(stats.body).toMatchObject({
      confirmed: 1,
      cancelled: 0,
      facilities: 1,
    });
    await patch(context.citizen, `citizen/bookings/${id}`, {
      status: "cancelled",
    }).expect(204);
    await patch(context.manager, `manager/facilities/${court.id}`, {
      status: "maintenance",
    }).expect(204);
    expect((await availability(context, court.id, start())).body).toEqual([]);
  });
  it("should honour a closure exception when a calendar removes a recurring opening", async () => {
    const context = await tenant();
    const stamp = Temporal.Instant.from(start())
      .toZonedDateTimeISO("Europe/Madrid")
      .toPlainDate()
      .toString()
      .replaceAll("-", "");
    const calendar = openingCalendar(randomUUID()).replace(
      "END:VEVENT",
      `EXDATE;TZID=Europe/Madrid:${stamp}T090000\r\nEND:VEVENT`,
    );
    const court = await facility(context, calendar);
    expect((await availability(context, court.id, start())).body).toEqual([]);
    expect(
      (
        await post(context.citizen, "citizen/bookings", {
          id: randomUUID(),
          facilityId: court.id,
          start: start(),
        }).expect(422)
      ).body.code,
    ).toBe("outside_opening");
  });
  it("should revoke the session when the user signs out", async () => {
    const context = await tenant();
    expect(
      (await context.citizen.get("/v2/public/session").expect(200)).body.session
        .role,
    ).toBe("citizen");
    await context.citizen
      .delete("/v2/public/session")
      .set("X-Quenda-Request", "1")
      .expect(204);
    await context.citizen.get("/v2/citizen/bookings").expect(401);
  });
  it("should publish an OpenAPI contract for each resource when the API starts", async () => {
    const schema = await request(app.getHttpServer())
      .get("/api/openapi.json")
      .expect(200);
    expect(schema.body.paths["/v2/citizen/bookings"].post).toBeDefined();
    expect(
      schema.body.components.schemas.FacilityResponseDTO.properties
        .openingCalendar.description,
    ).toContain("RFC 5545");
  });
});
