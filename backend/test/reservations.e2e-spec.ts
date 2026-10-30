// SPDX-License-Identifier: AGPL-3.0-or-later
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { randomUUID } from "node:crypto";
import request from "supertest";
import { Temporal } from "@js-temporal/polyfill";
import { openingCalendar } from "../src/database/seed";
import {
  availability,
  facility,
  slotStatus,
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
describe("Municipal reservations through HTTP and PostgreSQL", () => {
  it("should expose public availability and reject protected or malformed requests when signed out", async () => {
    const context = await tenant();
    const court = await facility(context);
    const anonymous = request(harness.app.getHttpServer());
    const municipalities = await anonymous
      .get("/v2/public/municipalities")
      .expect(200);
    expect(
      municipalities.body.some(
        (item: { id: string }) => item.id === context.id,
      ),
    ).toBe(true);
    expect(
      municipalities.body.find((item: { id: string }) => item.id === context.id)
        .accessibility,
    ).toEqual({
      unit: "",
      email: "",
      phone: "",
      reviewedOn: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
      method: "self",
      exceptions: { gl: "", es: "" },
    });
    expect(
      (await anonymous.get("/v2/public/session").expect(200)).body.session,
    ).toBe(null);
    const catalog = await anonymous
      .get("/v2/public/facilities")
      .query({ slug: context.slug })
      .expect(200);
    expect(catalog.body.items[0]).toMatchObject({
      id: court.id,
      resources: [
        {
          id: court.id,
          name: court.name,
          parentId: null,
          active: true,
          position: 0,
        },
      ],
    });
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
    expect(await slotStatus(context, court.id, begins)).toBe("booked");
    const noticeCount = await harness.db.query(
      "SELECT count(*)::int AS count FROM notifications WHERE tenant_id=$1",
      [context.id],
    );
    expect(noticeCount.rows[0].count).toBe(1);
    const bookings = await harness.db.query(
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
    expect(await slotStatus(context, court.id, begins)).toBe("available");
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
      resourceId: court.id,
      resourceName: court.name,
    });
    const notices = await context.citizen
      .get("/v2/citizen/notifications")
      .expect(200);
    expect(
      notices.body.map((item: { kind: string }) => item.kind).sort(),
    ).toEqual(["cancelled", "confirmed", "rescheduled"]);
    expect(notices.body[0]).toMatchObject({
      resourceId: court.id,
      resourceName: court.name,
    });
    expect(await slotStatus(context, court.id, later)).toBe("available");
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
    expect(
      (await availability(context, court.id, start())).body.resources,
    ).toEqual([
      {
        id: court.id,
        name: court.name,
        parentId: null,
        active: true,
        slots: [],
      },
    ]);
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
    expect(
      (await availability(context, court.id, start())).body.resources[0].slots,
    ).toEqual([]);
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
  it("should keep a personal calendar feed in sync when a reservation is moved, cancelled and the link revoked", async () => {
    const context = await tenant();
    const court = await facility(context);
    const id = randomUUID();
    const later = start(3, 11);
    await post(context.citizen, "citizen/bookings", {
      id,
      facilityId: court.id,
      start: start(),
    }).expect(201);
    const anonymous = request(harness.app.getHttpServer());
    const download = await context.citizen
      .get(`/v2/citizen/bookings/${id}/calendar.ics`)
      .expect(200)
      .expect("Content-Type", /text\/calendar/);
    expect(download.text).toContain(`UID:${id}@quenda`);
    expect(download.text).toContain("SEQUENCE:0");
    await anonymous.get(`/v2/citizen/bookings/${id}/calendar.ics`).expect(401);
    await context.manager
      .get(`/v2/citizen/bookings/${id}/calendar.ics`)
      .expect(404);
    expect(
      (await context.citizen.get("/v2/citizen/calendar-feed").expect(200)).body,
    ).toEqual({ active: false, createdAt: null });
    const link = await post(context.citizen, "citizen/calendar-feed", {});
    expect(link.status).toBe(201);
    const feedPath = link.body.path as string;
    expect(feedPath).toMatch(
      /^\/v2\/public\/calendar-feeds\/[0-9a-f]{64}\.ics$/,
    );
    await patch(context.citizen, `citizen/bookings/${id}`, {
      start: later,
    }).expect(204);
    const moved = await anonymous.get(feedPath).expect(200);
    const dtstart = later.replaceAll(/[-:]/g, "").replace(/\.\d+/, "");
    expect(moved.text).toContain(`UID:${id}@quenda`);
    expect(moved.text).toContain("SEQUENCE:1");
    expect(moved.text).toContain(`DTSTART:${dtstart}`);
    expect(moved.text).toContain(`SUMMARY:${court.name}`);
    expect(moved.text).not.toContain("citizen");
    await patch(context.citizen, `citizen/bookings/${id}`, {
      status: "cancelled",
    }).expect(204);
    const cancelled = await anonymous.get(feedPath).expect(200);
    expect(cancelled.text).toContain("SEQUENCE:2");
    expect(cancelled.text).toContain("STATUS:CANCELLED");
    const rotated = await post(context.citizen, "citizen/calendar-feed", {});
    await anonymous.get(feedPath).expect(404);
    await anonymous.get(rotated.body.path as string).expect(200);
    await context.citizen
      .delete("/v2/citizen/calendar-feed")
      .set("X-Quenda-Request", "1")
      .expect(204);
    await anonymous.get(rotated.body.path as string).expect(404);
    await anonymous
      .get("/v2/public/calendar-feeds/not-a-token.ics")
      .expect(400);
  });
  it("should update calendar revisions when the municipality cancels a reservation", async () => {
    const context = await tenant();
    const court = await facility(context);
    const id = randomUUID();
    await post(context.citizen, "citizen/bookings", {
      id,
      facilityId: court.id,
      start: start(),
    }).expect(201);
    const feed = await post(
      context.citizen,
      "citizen/calendar-feed",
      {},
    ).expect(201);
    await patch(context.manager, `manager/bookings/${id}`, {
      status: "cancelled",
      reason: "Maintenance",
    }).expect(204);
    const calendar = await request(harness.app.getHttpServer())
      .get(feed.body.path as string)
      .expect(200);
    expect(calendar.text).toContain("SEQUENCE:1");
    expect(calendar.text).toContain("STATUS:CANCELLED");
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
    const schema = await request(harness.app.getHttpServer())
      .get("/api/openapi.json")
      .expect(200);
    expect(schema.body.paths["/v2/citizen/bookings"].post).toBeDefined();
    expect(
      schema.body.components.schemas.FacilityResponseDTO.properties
        .openingCalendar.description,
    ).toContain("RFC 5545");
  });
});
