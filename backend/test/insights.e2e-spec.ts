// SPDX-License-Identifier: AGPL-3.0-or-later
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import {
  facility,
  harness,
  patch,
  setup,
  teardown,
  tenant,
  type Tenant,
} from "./harness";
beforeAll(setup);
afterAll(teardown);
// Seed calendars open 09:00–22:00 every day: 13 hours.
const DAY_MINUTES = 13 * 60;
/** Past bookings cannot go through the API, so history is written as the platform would have. */
async function booking(
  context: Tenant,
  facilityId: string,
  start: string,
  end: string,
  status: "confirmed" | "cancelled" = "confirmed",
) {
  await harness.db.query(
    "INSERT INTO bookings (id,tenant_id,user_id,facility_id,starts_at,ends_at,status,created_at,cancelled_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$5,$8)",
    [
      randomUUID(),
      context.id,
      context.users.citizen,
      facilityId,
      start,
      end,
      status,
      status === "cancelled" ? start : null,
    ],
  );
}
/** Facilities created through the API start their history now; tests reach back to 2026. */
async function activeSince2026(context: Tenant) {
  await harness.db.query(
    "UPDATE facility_status_periods SET starts_at='2026-01-01T00:00:00Z' WHERE tenant_id=$1 AND ends_at IS NULL",
    [context.id],
  );
}
function insights(context: Tenant, from: string, to: string) {
  return context.manager.get("/v2/manager/insights").query({ from, to });
}
describe("Indicators through HTTP and PostgreSQL", () => {
  it("should report booked against open time per facility and weekday × hour for a range", async () => {
    const context = await tenant();
    const court = await facility(context);
    await activeSince2026(context);
    // Monday 5 October 2026, 10:00–11:00 local (CEST, UTC+2).
    await booking(
      context,
      court.id,
      "2026-10-05T08:00:00Z",
      "2026-10-05T09:00:00Z",
    );
    await booking(
      context,
      court.id,
      "2026-10-06T08:00:00Z",
      "2026-10-06T09:00:00Z",
      "cancelled",
    );
    const result = await insights(context, "2026-10-05", "2026-10-11").expect(
      200,
    );
    expect(result.body).toMatchObject({
      from: "2026-10-05",
      to: "2026-10-11",
      total: 2,
      confirmed: 1,
      cancelled: 1,
      noShows: null,
      bookedMinutes: 60,
      openMinutes: 7 * DAY_MINUTES,
      occupancy: 1,
    });
    expect(result.body.byFacility[0]).toMatchObject({
      id: court.id,
      confirmed: 1,
      cancelled: 1,
      bookings: 1,
    });
    expect(
      result.body.heatmap.find(
        (cell: { weekday: number; hour: number }) =>
          cell.weekday === 1 && cell.hour === 10,
      ),
    ).toEqual({
      weekday: 1,
      hour: 10,
      bookedMinutes: 60,
      openMinutes: 60,
      occupancy: 100,
    });
    expect(result.body.heatmap).toHaveLength(7 * 13);
  });
  it("should leave holidays and maintenance periods out of open time", async () => {
    const context = await tenant();
    const court = await facility(context);
    const pool = await facility(context);
    await activeSince2026(context);
    await patch(context.manager, "manager/municipality", {
      holidaysCalendar: [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "PRODID:-//Quenda//Holidays//GL",
        "BEGIN:VEVENT",
        "UID:local@quenda",
        "DTSTAMP:20260101T000000Z",
        "DTSTART;VALUE=DATE:20261007",
        "END:VEVENT",
        "END:VCALENDAR",
        "",
      ].join("\r\n"),
    }).expect(200);
    // The pool was in maintenance from 8 to 10 October (local midnight, CEST).
    await harness.db.query(
      "DELETE FROM facility_status_periods WHERE tenant_id=$1 AND facility_id=$2",
      [context.id, pool.id],
    );
    for (const [status, start, end] of [
      ["active", "2026-01-01T00:00:00Z", "2026-10-07T22:00:00Z"],
      ["maintenance", "2026-10-07T22:00:00Z", "2026-10-09T22:00:00Z"],
      ["active", "2026-10-09T22:00:00Z", null],
    ])
      await harness.db.query(
        "INSERT INTO facility_status_periods (tenant_id,facility_id,status,starts_at,ends_at) VALUES ($1,$2,$3,$4,$5)",
        [context.id, pool.id, status, start, end],
      );
    const result = await insights(context, "2026-10-05", "2026-10-11").expect(
      200,
    );
    const minutes = (id: string) =>
      result.body.byFacility.find((item: { id: string }) => item.id === id)
        .openMinutes;
    expect(minutes(court.id)).toBe(6 * DAY_MINUTES);
    expect(minutes(pool.id)).toBe(4 * DAY_MINUTES);
    expect(
      result.body.heatmap.some(
        (cell: { weekday: number }) => cell.weekday === 3,
      ),
    ).toBe(false);
  });
  it("should record every status change for later ranges", async () => {
    const context = await tenant();
    const court = await facility(context);
    await patch(context.manager, `manager/facilities/${court.id}`, {
      status: "maintenance",
    }).expect(204);
    await patch(context.manager, `manager/facilities/${court.id}`, {
      status: "active",
    }).expect(204);
    const { rows } = await harness.db.query(
      "SELECT status, ends_at IS NULL AS current FROM facility_status_periods WHERE facility_id=$1 ORDER BY starts_at",
      [court.id],
    );
    expect(rows).toEqual([
      { status: "active", current: false },
      { status: "maintenance", current: false },
      { status: "active", current: true },
    ]);
  });
  it("should rebuild missing status history from the audit trail when migrating", async () => {
    const context = await tenant();
    const court = await facility(context);
    await patch(context.manager, `manager/facilities/${court.id}`, {
      status: "closed",
    }).expect(204);
    await harness.db.query(
      "DELETE FROM facility_status_periods WHERE facility_id=$1",
      [court.id],
    );
    await harness.db.query(
      await readFile(
        new URL("../src/database/schema.sql", import.meta.url),
        "utf8",
      ),
    );
    const { rows } = await harness.db.query(
      "SELECT status, ends_at IS NULL AS current FROM facility_status_periods WHERE facility_id=$1 ORDER BY starts_at",
      [court.id],
    );
    expect(rows).toEqual([
      { status: "active", current: false },
      { status: "closed", current: true },
    ]);
  });
  it("should reject ranges longer than 16 months, malformed dates and citizens", async () => {
    const context = await tenant();
    await insights(context, "2025-01-01", "2026-04-30").expect(200);
    await insights(context, "2025-01-01", "2026-05-01").expect(400);
    await insights(context, "2026-10-10", "2026-10-01").expect(400);
    await insights(context, "2026-02-30", "2026-03-01").expect(400);
    await context.manager
      .get("/v2/manager/insights")
      .query({ from: "2026-10-01" })
      .expect(400);
    await context.citizen
      .get("/v2/manager/insights")
      .query({ from: "2026-10-01", to: "2026-10-31" })
      .expect(403);
    await context.citizen.get("/v2/manager/insights/export").expect(403);
  });
  it("should download the indicators as a spreadsheet-ready CSV", async () => {
    const context = await tenant();
    const court = await facility(context);
    await activeSince2026(context);
    await booking(
      context,
      court.id,
      "2026-10-05T08:00:00Z",
      "2026-10-05T09:00:00Z",
    );
    const response = await context.manager
      .get("/v2/manager/insights/export")
      .set("Accept-Language", "es")
      .query({ from: "2026-10-05", to: "2026-10-11" })
      .buffer(true)
      .parse((res, done) => {
        let text = "";
        res.setEncoding("utf8");
        res.on("data", (chunk: string) => (text += chunk));
        res.on("end", () => done(null, text));
      })
      .expect(200);
    expect(response.headers["content-type"]).toBe("text/csv; charset=utf-8");
    expect(response.headers["content-disposition"]).toBe(
      `attachment; filename="indicadores-${context.slug}-2026-10-05-2026-10-11.csv"`,
    );
    const text = response.body as string;
    expect(text.startsWith("﻿Periodo;2026-10-05;2026-10-11\r\n")).toBe(true);
    expect(text).toContain(
      `${court.name};padel;1;0;;1,0;${(7 * DAY_MINUTES) / 60},0;1\r\n`,
    );
    expect(text).toContain("Lunes;10:00;1,0;1,0;100\r\n");
    const galician = await context.manager
      .get("/v2/manager/insights/export")
      .set("Accept-Language", "es")
      .query({ from: "2026-10-05", to: "2026-10-11", lang: "gl" })
      .buffer(true)
      .parse((res, done) => {
        let body = "";
        res.setEncoding("utf8");
        res.on("data", (chunk: string) => (body += chunk));
        res.on("end", () => done(null, body));
      })
      .expect(200);
    expect(galician.body as string).toContain("Luns;10:00;");
  });
});
