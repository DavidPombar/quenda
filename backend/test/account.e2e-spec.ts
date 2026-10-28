// SPDX-License-Identifier: AGPL-3.0-or-later
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { randomUUID } from "node:crypto";
import request from "supertest";
import {
  LEGAL_VERSION,
  del,
  facility,
  harness,
  patch,
  post,
  setup,
  slotStatus,
  start,
  teardown,
  tenant,
} from "./harness";
beforeAll(setup);
afterAll(teardown);
describe("Account rights (T4) through HTTP and PostgreSQL", () => {
  it("should require the current privacy notice version when a citizen opens a demo session", async () => {
    const context = await tenant();
    const visitor = request.agent(harness.app.getHttpServer());
    expect(
      (
        await post(visitor, "public/sessions", {
          slug: context.slug,
          role: "citizen",
        }).expect(422)
      ).body.code,
    ).toBe("consent_required");
    expect(
      (
        await post(visitor, "public/sessions", {
          slug: context.slug,
          role: "citizen",
          legalVersion: "2000-01",
        }).expect(422)
      ).body.code,
    ).toBe("consent_required");
    await post(visitor, "public/sessions", {
      slug: context.slug,
      role: "citizen",
      legalVersion: LEGAL_VERSION,
    }).expect(201);
    const consents = await harness.db.query(
      "SELECT legal_version FROM consents WHERE tenant_id=$1 AND user_id=$2",
      [context.id, context.users.citizen],
    );
    expect(consents.rows.map((row) => row.legal_version)).toEqual([
      LEGAL_VERSION,
      LEGAL_VERSION,
    ]);
    const audit = await harness.db.query(
      "SELECT actor_role, details FROM audit_events WHERE tenant_id=$1 AND action='consent.accepted'",
      [context.id],
    );
    expect(audit.rows[0]).toEqual({
      actor_role: "citizen",
      details: { legalVersion: LEGAL_VERSION },
    });
    const me = await context.citizen.get("/v2/citizen/me").expect(200);
    expect(me.body).toMatchObject({
      userId: context.users.citizen,
      currentLegalVersion: LEGAL_VERSION,
      consentUpToDate: true,
      bookings: 0,
      notifications: 0,
    });
  });
  it("should export every record about the person as a JSON attachment when they ask for their data", async () => {
    const context = await tenant();
    const court = await facility(context);
    const ids = [randomUUID(), randomUUID(), randomUUID()];
    for (const [index, id] of ids.entries())
      await post(context.citizen, "citizen/bookings", {
        id,
        facilityId: court.id,
        start: start(index + 1),
      }).expect(201);
    await patch(context.citizen, `citizen/bookings/${ids[0]}`, {
      status: "cancelled",
    }).expect(204);
    // History endpoints page at 200 rows; the export must not.
    await harness.db.query(
      `INSERT INTO bookings (id, tenant_id, user_id, facility_id, resource_id, starts_at, ends_at, status, created_at)
       SELECT gen_random_uuid(), $1, $2, $3, $3,
              now() - (n || ' days')::interval,
              now() - (n || ' days')::interval + interval '1 hour',
              'confirmed', now() - (n || ' days')::interval
       FROM generate_series(1, 205) AS n`,
      [context.id, context.users.citizen, court.id],
    );
    const exported = await context.citizen
      .get("/v2/citizen/me/export")
      .expect(200);
    expect(exported.headers["content-disposition"]).toMatch(
      new RegExp(
        `attachment; filename="quenda-${context.slug}-\\d{4}-\\d{2}-\\d{2}\\.json"`,
      ),
    );
    expect(exported.body.municipality).toMatchObject({
      slug: context.slug,
      legalVersion: LEGAL_VERSION,
      retentionMonths: 24,
    });
    expect(exported.body.profile.userId).toBe(context.users.citizen);
    expect(exported.body.consents).toHaveLength(1);
    expect(exported.body.bookings).toHaveLength(208);
    expect(
      exported.body.bookings.filter(
        (item: { status: string }) => item.status === "cancelled",
      ),
    ).toHaveLength(1);
    expect(exported.body.bookings[0]).toMatchObject({
      facilityName: court.name,
      resourceId: court.id,
      resourceName: court.name,
    });
    expect(exported.body.notifications).toHaveLength(4);
    expect(exported.body.notifications[0]).toMatchObject({
      resourceId: court.id,
      resourceName: court.name,
    });
    expect(
      exported.body.auditEvents.map((item: { action: string }) => item.action),
    ).toEqual(expect.arrayContaining(["consent.accepted", "booking.created"]));
    const audit = await harness.db.query(
      "SELECT count(*)::int AS count FROM audit_events WHERE tenant_id=$1 AND actor_id=$2 AND action='account.exported'",
      [context.id, context.users.citizen],
    );
    expect(audit.rows[0].count).toBe(1);
  });
  it("should anonymise the account, release upcoming slots and revoke access when a citizen deletes their account", async () => {
    const context = await tenant();
    const court = await facility(context);
    const begins = start();
    await post(context.citizen, "citizen/bookings", {
      id: randomUUID(),
      facilityId: court.id,
      start: begins,
    }).expect(201);
    const feed = await post(
      context.citizen,
      "citizen/calendar-feed",
      {},
    ).expect(201);
    await request(harness.app.getHttpServer())
      .get(feed.body.path as string)
      .expect(200);
    await del(context.citizen, "citizen/me").expect(204);
    await request(harness.app.getHttpServer())
      .get(feed.body.path as string)
      .expect(404);
    await context.citizen.get("/v2/citizen/bookings").expect(401);
    const user = await harness.db.query(
      "SELECT display_name, deleted_at FROM users WHERE id=$1",
      [context.users.citizen],
    );
    expect(user.rows[0].display_name).toBe("Conta eliminada");
    expect(user.rows[0].deleted_at).not.toBeNull();
    const bookings = await harness.db.query(
      "SELECT status, cancelled_at FROM bookings WHERE tenant_id=$1 AND user_id=$2",
      [context.id, context.users.citizen],
    );
    expect(bookings.rows).toHaveLength(1);
    expect(bookings.rows[0].status).toBe("cancelled");
    expect(bookings.rows[0].cancelled_at).not.toBeNull();
    for (const table of ["notifications", "sessions", "calendar_feeds"]) {
      const rows = await harness.db.query(
        `SELECT count(*)::int AS count FROM ${table} WHERE tenant_id=$1 AND user_id=$2`,
        [context.id, context.users.citizen],
      );
      expect(rows.rows[0].count).toBe(0);
    }
    const audit = await harness.db.query(
      "SELECT details FROM audit_events WHERE tenant_id=$1 AND action='account.deleted'",
      [context.id],
    );
    expect(audit.rows[0].details).toEqual({
      cancelledBookings: 1,
      revokedSessions: 1,
    });
    expect(await slotStatus(context, court.id, begins)).toBe("available");
    const stats = await context.manager.get("/v2/manager/insights").expect(200);
    expect(stats.body).toMatchObject({ confirmed: 0, cancelled: 1 });
  });
  it("should offer a fresh synthetic citizen when the only demo account has been deleted", async () => {
    const context = await tenant();
    await del(context.citizen, "citizen/me").expect(204);
    const next = request.agent(harness.app.getHttpServer());
    const session = await post(next, "public/sessions", {
      slug: context.slug,
      role: "citizen",
      legalVersion: LEGAL_VERSION,
    }).expect(201);
    expect(session.body.userId).not.toBe(context.users.citizen);
    expect(
      (await next.get("/v2/citizen/me").expect(200)).body.consentUpToDate,
    ).toBe(true);
    const active = await harness.db.query(
      "SELECT count(*)::int AS count FROM users WHERE tenant_id=$1 AND role='citizen' AND deleted_at IS NULL",
      [context.id],
    );
    expect(active.rows[0].count).toBe(1);
  });
  it("should refuse account export and deletion when the session belongs to a manager", async () => {
    const context = await tenant();
    expect(
      (await context.manager.get("/v2/citizen/me/export").expect(403)).body
        .code,
    ).toBe("forbidden");
    await del(context.manager, "citizen/me").expect(403);
    await context.manager.get("/v2/manager/insights").expect(200);
  });
});
