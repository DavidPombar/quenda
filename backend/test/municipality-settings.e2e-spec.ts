// SPDX-License-Identifier: AGPL-3.0-or-later
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { randomUUID } from "node:crypto";
import request from "supertest";
import { Temporal } from "@js-temporal/polyfill";
import {
  availability,
  del,
  facility,
  harness,
  patch,
  post,
  setup,
  start,
  teardown,
  tenant,
  type Agent,
} from "./harness";
beforeAll(setup);
afterAll(teardown);
const PNG = Buffer.from(
  "89504e470d0a1a0a0000000d4948445200000001000000010806000000" +
    "1f15c4890000000d49444154789c6360000002000154a24f5d0000000049454e44ae426082",
  "hex",
);
const LEGAL = {
  gl: "Novo aviso de privacidade do concello para as reservas.",
  es: "Nuevo aviso de privacidad del ayuntamiento para las reservas.",
};
function holidays(date: string) {
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Quenda//Holidays//GL",
    "BEGIN:VEVENT",
    "UID:local-holiday@quenda",
    "DTSTAMP:20260101T000000Z",
    `DTSTART;VALUE=DATE:${date.replaceAll("-", "")}`,
    "SUMMARY:Festa local",
    "END:VEVENT",
    "END:VCALENDAR",
    "",
  ].join("\r\n");
}
function localDate(instant: string) {
  return Temporal.Instant.from(instant)
    .toZonedDateTimeISO("Europe/Madrid")
    .toPlainDate()
    .toString();
}
function upload(agent: Agent, type: string, body: Buffer) {
  return agent
    .put("/v2/manager/municipality/logo")
    .set("X-Quenda-Request", "1")
    .set("Content-Type", type)
    .send(body);
}
async function publicSettings(slug: string) {
  const list = await request(harness.app.getHttpServer())
    .get("/v2/public/municipalities")
    .expect(200);
  return list.body.find((item: { slug: string }) => item.slug === slug);
}
describe("Municipal settings through HTTP and PostgreSQL", () => {
  it("should let only managers read the settings of their own municipality", async () => {
    const context = await tenant();
    const settings = await context.manager
      .get("/v2/manager/municipality")
      .expect(200);
    expect(settings.body).toMatchObject({
      id: context.id,
      locale: "gl",
      cancellationHours: 2,
      primaryColor: "#1f5b43",
      holidaysCalendar: "",
      logoUrl: null,
      legalTexts: { gl: "Synthetic test data", es: "Synthetic test data" },
    });
    await context.citizen.get("/v2/manager/municipality").expect(403);
    await request(harness.app.getHttpServer())
      .get("/v2/manager/municipality")
      .expect(401);
    await patch(context.citizen, "manager/municipality", {
      cancellationHours: 1,
    }).expect(403);
  });
  it("should apply a new cancellation deadline and notice version without touching the database", async () => {
    const context = await tenant();
    const court = await facility(context);
    const earlier = randomUUID();
    await post(context.citizen, "citizen/bookings", {
      id: earlier,
      facilityId: court.id,
      start: start(1, 10),
    }).expect(201);
    const updated = await patch(context.manager, "manager/municipality", {
      cancellationHours: 48,
      legalTexts: LEGAL,
    }).expect(200);
    expect(updated.body.settings.legalVersion).toMatch(
      /^\d{4}-\d{2}-\d{2}\.1$/,
    );
    expect(await publicSettings(context.slug)).toMatchObject({
      cancellationHours: 48,
      legalTexts: LEGAL,
      legalVersion: updated.body.settings.legalVersion,
    });
    expect(
      (await context.citizen.get("/v2/citizen/me").expect(200)).body
        .consentUpToDate,
    ).toBe(false);
    // The booking made under the 2-hour rule keeps it; a new one gets 48 hours.
    await patch(context.citizen, `citizen/bookings/${earlier}`, {
      status: "cancelled",
    }).expect(204);
    const later = randomUUID();
    await post(context.citizen, "citizen/bookings", {
      id: later,
      facilityId: court.id,
      start: start(1, 11),
    }).expect(201);
    expect(
      (
        await patch(context.citizen, `citizen/bookings/${later}`, {
          status: "cancelled",
        }).expect(422)
      ).body.code,
    ).toBe("cancellation_deadline");
    const second = await patch(context.manager, "manager/municipality", {
      legalTexts: { ...LEGAL, es: `${LEGAL.es} Revisado.` },
    }).expect(200);
    expect(second.body.settings.legalVersion).toMatch(/\.2$/);
    const stored = await harness.db.query(
      "SELECT version, text_es FROM legal_texts WHERE tenant_id=$1 ORDER BY published_at",
      [context.id],
    );
    expect(stored.rows.map((row) => row.version)).toEqual([
      updated.body.settings.legalVersion,
      second.body.settings.legalVersion,
    ]);
    const events = await context.manager.get("/v2/manager/audit").expect(200);
    expect(JSON.stringify(events.body)).toContain("municipality.updated");
  });
  it("should reject invalid values and colours below AA contrast", async () => {
    const context = await tenant();
    await patch(context.manager, "manager/municipality", {
      advanceDays: 0,
    }).expect(400);
    await patch(context.manager, "manager/municipality", {
      tenantId: randomUUID(),
    }).expect(400);
    await patch(context.manager, "manager/municipality", {
      legalTexts: { gl: LEGAL.gl },
    }).expect(400);
    expect(
      (
        await patch(context.manager, "manager/municipality", {
          primaryColor: "#ffd700",
        }).expect(422)
      ).body.code,
    ).toBe("insufficient_contrast");
    expect(
      (
        await patch(context.manager, "manager/municipality", {
          holidaysCalendar: "BEGIN:VCALENDAR",
        }).expect(422)
      ).body.code,
    ).toBe("invalid_holidays");
    const saved = await patch(context.manager, "manager/municipality", {
      primaryColor: "#1A4D8F",
      locale: "es",
    }).expect(200);
    expect(saved.body.settings).toMatchObject({
      primaryColor: "#1a4d8f",
      locale: "es",
    });
  });
  it("should close facilities on municipal holidays unless they opt out, keeping existing bookings", async () => {
    const context = await tenant();
    const court = await facility(context);
    const begins = start(4, 10);
    const date = localDate(begins);
    await post(context.citizen, "citizen/bookings", {
      id: randomUUID(),
      facilityId: court.id,
      start: begins,
    }).expect(201);
    const updated = await patch(context.manager, "manager/municipality", {
      holidaysCalendar: holidays(date),
    }).expect(200);
    expect(updated.body.affectedBookings).toBe(1);
    expect((await availability(context, court.id, begins)).body).toEqual([]);
    expect(
      (
        await post(context.citizen, "citizen/bookings", {
          id: randomUUID(),
          facilityId: court.id,
          start: start(4, 12),
        }).expect(422)
      ).body.code,
    ).toBe("outside_opening");
    await patch(context.manager, `manager/facilities/${court.id}`, {
      followsMunicipalHolidays: false,
    }).expect(204);
    expect(
      (await availability(context, court.id, begins)).body.length,
    ).toBeGreaterThan(0);
    await post(context.citizen, "citizen/bookings", {
      id: randomUUID(),
      facilityId: court.id,
      start: start(4, 12),
    }).expect(201);
  });
  it("should store, serve and remove the logo with type and size limits", async () => {
    const context = await tenant();
    await upload(context.manager, "image/png", PNG).expect(204);
    const { logoUrl } = await publicSettings(context.slug);
    expect(logoUrl).toMatch(
      new RegExp(`^/v2/public/municipalities/${context.slug}/logo\\?v=`),
    );
    const image = await request(harness.app.getHttpServer())
      .get(logoUrl)
      .buffer(true)
      .expect(200);
    expect(image.headers["content-type"]).toBe("image/png");
    expect(image.headers["cache-control"]).toContain("immutable");
    expect(Buffer.compare(image.body as Buffer, PNG)).toBe(0);
    await upload(context.manager, "image/jpeg", PNG).expect(415);
    await context.manager
      .put("/v2/manager/municipality/logo")
      .set("X-Quenda-Request", "1")
      .set("Content-Type", "image/svg+xml")
      .send("<svg/>")
      .expect(415);
    await upload(
      context.manager,
      "image/png",
      Buffer.concat([PNG, Buffer.alloc(2 * 1024 * 1024)]),
    ).expect(413);
    await upload(context.citizen, "image/png", PNG).expect(403);
    await del(context.manager, "manager/municipality/logo").expect(204);
    expect((await publicSettings(context.slug)).logoUrl).toBe(null);
    await request(harness.app.getHttpServer())
      .get(`/v2/public/municipalities/${context.slug}/logo`)
      .expect(404);
  });
});
