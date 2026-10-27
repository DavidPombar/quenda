// SPDX-License-Identifier: AGPL-3.0-or-later
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { randomUUID } from "node:crypto";
import { Temporal } from "@js-temporal/polyfill";
import {
  Tenant,
  facility,
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
const zone = "Europe/Madrid";
/** A slot that has already started today, local time. */
function startedToday() {
  const now = Temporal.Now.zonedDateTimeISO(zone);
  const earlier = now.subtract({ minutes: 30 });
  return (
    earlier.toPlainDate().equals(now.toPlainDate()) ? earlier : now.startOfDay()
  ).toInstant();
}
function daysAgo(days: number) {
  return Temporal.Now.instant().subtract({ hours: days * 24 });
}
// Past reservations cannot be made through the API, so they are written as installed history.
async function booking(
  context: Tenant,
  facilityId: string,
  begins: Temporal.Instant,
  status: "confirmed" | "no_show" = "confirmed",
) {
  const id = randomUUID();
  await harness.db.query(
    "INSERT INTO bookings (id,tenant_id,user_id,facility_id,starts_at,ends_at,status,created_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)",
    [
      id,
      context.id,
      context.users.citizen,
      facilityId,
      begins.toString(),
      begins.add({ minutes: 60 }).toString(),
      status,
      begins.subtract({ hours: 48 }).toString(),
    ],
  );
  return id;
}
async function auditActions(context: Tenant) {
  return (
    await harness.db.query<{
      action: string;
      details: Record<string, unknown>;
    }>(
      "SELECT action, details FROM audit_events WHERE tenant_id=$1 ORDER BY occurred_at",
      [context.id],
    )
  ).rows;
}
describe("Attendance, no-show penalty and municipal cancellations", () => {
  it("should mark a no-show only on the booking's day and show it in the person's history and notices", async () => {
    const context = await tenant();
    const court = await facility(context);
    const today = await booking(context, court.id, startedToday());
    const earlier = await booking(context, court.id, daysAgo(2));
    const upcoming = await booking(
      context,
      court.id,
      Temporal.Instant.from(start(3)),
    );
    await patch(context.citizen, `manager/bookings/${today}`, {
      attendance: "no_show",
    }).expect(403);
    await patch(context.manager, `manager/bookings/${today}`, {
      attendance: "no_show",
      reason: "x",
    }).expect(400);
    await patch(context.manager, `manager/bookings/${today}`, {
      attendance: "no_show",
    }).expect(204);
    for (const id of [earlier, upcoming])
      expect(
        (
          await patch(context.manager, `manager/bookings/${id}`, {
            attendance: "no_show",
          }).expect(422)
        ).body.code,
      ).toBe("attendance_window");
    const history = (
      await context.citizen.get("/v2/citizen/bookings").expect(200)
    ).body as { id: string; outcome: string }[];
    expect(
      Object.fromEntries(history.map((item) => [item.id, item.outcome])),
    ).toEqual({
      [today]: "no_show",
      [earlier]: "attended",
      [upcoming]: "upcoming",
    });
    const notices = (
      await context.citizen.get("/v2/citizen/notifications").expect(200)
    ).body as { kind: string; details: { standing: unknown } }[];
    expect(
      notices.find((item) => item.kind === "no_show")?.details.standing,
    ).toMatchObject({
      count: 1,
      limit: 3,
      remaining: 2,
      blockedUntil: null,
    });
    const date = Temporal.Now.zonedDateTimeISO(zone).toPlainDate().toString();
    const day = (
      await context.manager
        .get("/v2/manager/bookings")
        .query({ date, facilityId: court.id })
        .expect(200)
    ).body as { id: string; displayName: string; canRevert: boolean }[];
    expect(day.find((item) => item.id === today)).toMatchObject({
      displayName: "citizen",
      canRevert: true,
    });
    await context.citizen
      .get("/v2/manager/bookings")
      .query({ date })
      .expect(403);
    expect(
      (await auditActions(context)).map((event) => event.action),
    ).toContain("booking.no_show");
  });
  it("should block new bookings after the third no-show in the window and lift it when one is corrected", async () => {
    const context = await tenant();
    const court = await facility(context);
    const older = await booking(context, court.id, daysAgo(40), "no_show");
    const first = await booking(context, court.id, daysAgo(10), "no_show");
    await booking(context, court.id, daysAgo(5), "no_show");
    const today = await booking(context, court.id, startedToday());
    await patch(context.manager, `manager/bookings/${today}`, {
      attendance: "no_show",
    }).expect(204);
    const blocked = (
      await context.citizen.get("/v2/citizen/penalty").expect(200)
    ).body as { count: number; remaining: number; blockedUntil: string | null };
    expect(blocked).toMatchObject({ count: 3, remaining: 0, enabled: true });
    expect(
      Temporal.Instant.from(blocked.blockedUntil!).epochMilliseconds,
    ).toBeGreaterThan(
      Temporal.Now.instant().add({ hours: 24 * 6 }).epochMilliseconds,
    );
    const kinds = (
      (await context.citizen.get("/v2/citizen/notifications").expect(200))
        .body as { kind: string }[]
    ).map((item) => item.kind);
    expect(kinds).toEqual(expect.arrayContaining(["no_show", "blocked"]));
    expect(
      (
        await post(context.citizen, "citizen/bookings", {
          id: randomUUID(),
          facilityId: court.id,
          start: start(2, 12),
        }).expect(422)
      ).body.code,
    ).toBe("booking_blocked");
    // Correcting a no-show outside the window that led to the block keeps it.
    await patch(context.manager, `manager/bookings/${older}`, {
      attendance: "attended",
    }).expect(204);
    expect(
      (await context.citizen.get("/v2/citizen/penalty").expect(200)).body
        .blockedUntil,
    ).not.toBe(null);
    await patch(context.manager, `manager/bookings/${first}`, {
      attendance: "attended",
    }).expect(204);
    expect(
      (await context.citizen.get("/v2/citizen/penalty").expect(200)).body,
    ).toMatchObject({ count: 2, remaining: 1, blockedUntil: null });
    expect(
      (
        (await context.citizen.get("/v2/citizen/notifications").expect(200))
          .body as { kind: string }[]
      ).map((item) => item.kind),
    ).toContain("unblocked");
    await post(context.citizen, "citizen/bookings", {
      id: randomUUID(),
      facilityId: court.id,
      start: start(2, 12),
    }).expect(201);
    expect((await auditActions(context)).map((event) => event.action)).toEqual(
      expect.arrayContaining([
        "user.blocked",
        "booking.attendance_corrected",
        "user.unblocked",
      ]),
    );
  });
  it("should never block when the municipality disables the penalty", async () => {
    const context = await tenant();
    const court = await facility(context);
    await patch(context.manager, "manager/municipality", {
      noShowLimit: 0,
    }).expect(200);
    await booking(context, court.id, daysAgo(3), "no_show");
    await booking(context, court.id, daysAgo(2), "no_show");
    const today = await booking(context, court.id, startedToday());
    await patch(context.manager, `manager/bookings/${today}`, {
      attendance: "no_show",
    }).expect(204);
    expect(
      (await context.citizen.get("/v2/citizen/penalty").expect(200)).body,
    ).toMatchObject({ enabled: false, count: 3, blockedUntil: null });
    await post(context.citizen, "citizen/bookings", {
      id: randomUUID(),
      facilityId: court.id,
      start: start(2, 12),
    }).expect(201);
  });
  it("should cancel one upcoming booking on behalf of the municipality only with a reason", async () => {
    const context = await tenant();
    const court = await facility(context);
    const id = randomUUID();
    await post(context.citizen, "citizen/bookings", {
      id,
      facilityId: court.id,
      start: start(2),
    }).expect(201);
    await patch(context.manager, `manager/bookings/${id}`, {
      status: "cancelled",
    }).expect(400);
    await patch(context.manager, `manager/bookings/${id}`, {
      status: "cancelled",
      reason: "   ",
    }).expect(400);
    await patch(context.manager, `manager/bookings/${id}`, {
      status: "cancelled",
      reason: "Avaría na iluminación",
    }).expect(204);
    const history = (
      await context.citizen.get("/v2/citizen/bookings").expect(200)
    ).body[0];
    expect(history).toMatchObject({
      status: "cancelled",
      outcome: "cancelled",
      cancelledBy: "municipality",
      cancellationReason: "Avaría na iluminación",
    });
    const notice = (
      (await context.citizen.get("/v2/citizen/notifications").expect(200))
        .body as { kind: string; details: { reason?: string } }[]
    ).find((item) => item.kind === "cancelled_by_municipality");
    expect(notice?.details.reason).toBe("Avaría na iluminación");
  });
  it("should close a facility with upcoming bookings only with a reason, cancelling and notifying each person", async () => {
    const context = await tenant();
    const court = await facility(context);
    for (const days of [2, 3])
      await post(context.citizen, "citizen/bookings", {
        id: randomUUID(),
        facilityId: court.id,
        start: start(days),
      }).expect(201);
    expect(
      (
        await context.manager
          .get(`/v2/manager/facilities/${court.id}/impact`)
          .expect(200)
      ).body,
    ).toEqual({ bookings: 2, people: 1 });
    await context.citizen
      .get(`/v2/manager/facilities/${court.id}/impact`)
      .expect(403);
    await patch(context.manager, `manager/facilities/${court.id}`, {
      status: "closed",
    }).expect(409);
    await patch(context.manager, `manager/facilities/${court.id}`, {
      slotMinutes: 90,
      closureReason: "Obras",
    }).expect(409);
    await patch(context.manager, `manager/facilities/${court.id}`, {
      status: "closed",
      closureReason: "Obras urxentes na cuberta",
    }).expect(204);
    const history = (
      await context.citizen.get("/v2/citizen/bookings").expect(200)
    ).body as {
      status: string;
      cancelledBy: string;
      cancellationReason: string;
    }[];
    expect(history).toHaveLength(2);
    for (const item of history)
      expect(item).toMatchObject({
        status: "cancelled",
        cancelledBy: "municipality",
        cancellationReason: "Obras urxentes na cuberta",
      });
    expect(
      (
        (await context.citizen.get("/v2/citizen/notifications").expect(200))
          .body as { kind: string }[]
      ).filter((item) => item.kind === "cancelled_by_municipality"),
    ).toHaveLength(2);
    const events = await auditActions(context);
    expect(
      events.filter(
        (event) => event.action === "booking.cancelled_by_municipality",
      ),
    ).toHaveLength(2);
    expect(
      events.filter((event) => event.action === "facility.updated").at(-1)
        ?.details,
    ).toMatchObject({
      after: { status: "closed" },
      closure: {
        reason: "Obras urxentes na cuberta",
        cancelledBookings: 2,
        people: 1,
      },
    });
    expect(
      (
        await context.manager
          .get(`/v2/manager/facilities/${court.id}/impact`)
          .expect(200)
      ).body,
    ).toEqual({ bookings: 0, people: 0 });
  });
  it("should include no-shows and blocks in the person's data export", async () => {
    const context = await tenant();
    const court = await facility(context);
    await booking(context, court.id, daysAgo(4), "no_show");
    await booking(context, court.id, daysAgo(3), "no_show");
    const today = await booking(context, court.id, startedToday());
    await patch(context.manager, `manager/bookings/${today}`, {
      attendance: "no_show",
    }).expect(204);
    const exported = (
      await context.citizen.get("/v2/citizen/me/export").expect(200)
    ).body as {
      bookings: { status: string }[];
      blocks: unknown[];
      notifications: { kind: string; details: unknown }[];
    };
    expect(exported.bookings.map((item) => item.status)).toEqual([
      "no_show",
      "no_show",
      "no_show",
    ]);
    expect(exported.blocks).toHaveLength(1);
    expect(
      exported.notifications.find((item) => item.kind === "blocked")?.details,
    ).toMatchObject({ standing: { count: 3 } });
  });
});
