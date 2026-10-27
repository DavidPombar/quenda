// SPDX-License-Identifier: AGPL-3.0-or-later
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { randomUUID } from "node:crypto";
import { createRequire } from "node:module";
import type { Type } from "@nestjs/common";
import { Temporal } from "@js-temporal/polyfill";
import {
  facility,
  harness,
  patch,
  post,
  setup,
  start,
  teardown,
  tenant,
} from "./harness";
const require = createRequire(import.meta.url);
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
function compiled() {
  const { Commands } =
    require("../dist/v2/shared/infrastructure/commands.locator.js") as {
      Commands: Type<Locator>;
    };
  const { ApplyRetention } =
    require("../dist/v2/modules/retention/application/commands/apply-retention.command.js") as {
      ApplyRetention: Type;
    };
  return { Commands, ApplyRetention };
}
beforeAll(setup);
afterAll(teardown);
function monthsAgo(months: number) {
  return Temporal.Now.zonedDateTimeISO("Europe/Madrid")
    .subtract({ months })
    .toInstant();
}
describe("Manager audit log (T4) through HTTP and PostgreSQL", () => {
  it("should reject the audit log for citizens", async () => {
    const context = await tenant();
    expect(
      (await context.citizen.get("/v2/manager/audit").expect(403)).body.code,
    ).toBe("forbidden");
  });
  it("should list detailed events newest first and filter them when a manager reads the audit log", async () => {
    const context = await tenant();
    const court = await facility(context);
    const first = randomUUID();
    const second = randomUUID();
    await post(context.citizen, "citizen/bookings", {
      id: first,
      facilityId: court.id,
      start: start(1),
    }).expect(201);
    await post(context.citizen, "citizen/bookings", {
      id: second,
      facilityId: court.id,
      start: start(3),
    }).expect(201);
    await patch(context.citizen, `citizen/bookings/${second}`, {
      status: "cancelled",
    }).expect(204);
    const all = (await context.manager.get("/v2/manager/audit").expect(200))
      .body as {
      action: string;
      resourceId: string;
      actorRole: string;
      actorName: string | null;
      occurredAt: string;
      details: Record<string, unknown> | null;
    }[];
    const created = all.find(
      (event) =>
        event.action === "booking.created" && event.resourceId === first,
    );
    expect(created).toMatchObject({
      actorRole: "citizen",
      actorName: "citizen",
      details: { facilityId: court.id, start: start(1) },
    });
    expect(
      all.find((event) => event.action === "facility.created")?.details,
    ).toMatchObject({
      before: null,
      after: { name: court.name, slotMinutes: 60 },
      openingCalendarChanged: true,
    });
    const times = all.map((event) => event.occurredAt);
    expect([...times].sort().reverse()).toEqual(times);
    const cancelled = await context.manager
      .get("/v2/manager/audit")
      .query({ action: "booking.cancelled" })
      .expect(200);
    expect(cancelled.body).toHaveLength(1);
    expect(cancelled.body[0]).toMatchObject({
      resourceId: second,
      details: { facilityId: court.id, start: start(3) },
    });
    const limited = await context.manager
      .get("/v2/manager/audit")
      .query({ limit: 1 })
      .expect(200);
    expect(limited.body).toHaveLength(1);
    expect(limited.body[0].action).toBe("booking.cancelled");
  });
  it("should reject invalid audit filters", async () => {
    const context = await tenant();
    for (const query of [
      { limit: 1000 },
      { limit: 0 },
      { from: "yesterday" },
      { from: "2026-10-02T00:00:00Z", to: "2026-10-01T00:00:00Z" },
    ])
      expect(
        (
          await context.manager
            .get("/v2/manager/audit")
            .query(query)
            .expect(400)
        ).body.code,
      ).toBe("validation");
  });
});
describe("Retention policy (T4)", () => {
  it("should detach, delete and pseudonymise only data older than the policy when retention runs", async () => {
    const context = await tenant();
    const court = await facility(context);
    const old = monthsAgo(30);
    const oldBooking = randomUUID();
    const oldNotification = randomUUID();
    const oldAudit = randomUUID();
    await harness.db.query(
      "INSERT INTO bookings (id,tenant_id,user_id,facility_id,starts_at,ends_at,status,created_at) VALUES ($1,$2,$3,$4,$5,$6,'confirmed',$5)",
      [
        oldBooking,
        context.id,
        context.users.citizen,
        court.id,
        old.subtract({ hours: 1 }).toString(),
        old.toString(),
      ],
    );
    await harness.db.query(
      "INSERT INTO notifications (id,tenant_id,user_id,booking_id,kind,created_at) VALUES ($1,$2,$3,$4,'confirmed',$5)",
      [
        oldNotification,
        context.id,
        context.users.citizen,
        oldBooking,
        old.subtract({ hours: 2 }).toString(),
      ],
    );
    await harness.db.query(
      "INSERT INTO audit_events (id,tenant_id,actor_id,actor_role,action,resource_id,occurred_at,details) VALUES ($1,$2,$3,'citizen','booking.created',$4,$5,NULL)",
      [
        oldAudit,
        context.id,
        context.users.citizen,
        oldBooking,
        old.subtract({ hours: 2 }).toString(),
      ],
    );
    const removed = randomUUID();
    await harness.db.query(
      "INSERT INTO users (id,tenant_id,display_name,role,deleted_at) VALUES ($1,$2,'Conta eliminada','citizen',$3)",
      [removed, context.id, old.toString()],
    );
    await harness.db.query(
      "INSERT INTO consents (id,tenant_id,user_id,legal_version,accepted_at) VALUES ($1,$2,$3,'2024-01',$4)",
      [
        randomUUID(),
        context.id,
        removed,
        old.subtract({ hours: 24 }).toString(),
      ],
    );
    // Abandoned OIDC sign-ins: one expired, one still pending.
    await harness.db.query(
      `INSERT INTO login_attempts (state_hash,tenant_id,nonce,code_verifier,legal_version,return_to,expires_at) VALUES
        ($1,$3,'n','v','2026-10','/app/x/instalacions',now() - interval '1 minute'),
        ($2,$3,'n','v','2026-10','/app/x/instalacions',now() + interval '9 minutes')`,
      [randomUUID(), randomUUID(), context.id],
    );
    const recent = randomUUID();
    await post(context.citizen, "citizen/bookings", {
      id: recent,
      facilityId: court.id,
      start: start(2),
    }).expect(201);

    const { Commands, ApplyRetention } = compiled();
    const result = await harness.app
      .get(Commands)
      .get(ApplyRetention)
      .execute({ tenantId: context.id });
    const summary = result.fold(
      (value) => value,
      (error) => {
        throw new Error(JSON.stringify(error));
      },
    );
    expect(summary).toMatchObject({
      bookingsDetached: 1,
      notificationsDeleted: 1,
      auditPseudonymised: 1,
      loginAttemptsPurged: 1,
      consentsDeleted: 1,
      usersPurged: 1,
    });
    expect(
      (
        await harness.db.query(
          "SELECT count(*)::int AS count FROM login_attempts WHERE tenant_id=$1",
          [context.id],
        )
      ).rows[0].count,
    ).toBe(1);

    const bookings = await harness.db.query(
      "SELECT id, user_id FROM bookings WHERE tenant_id=$1",
      [context.id],
    );
    expect(
      Object.fromEntries(bookings.rows.map((row) => [row.id, row.user_id])),
    ).toEqual({ [oldBooking]: null, [recent]: context.users.citizen });
    expect(
      (
        await harness.db.query("SELECT 1 FROM notifications WHERE id=$1", [
          oldNotification,
        ])
      ).rowCount,
    ).toBe(0);
    expect(
      (
        await harness.db.query(
          "SELECT 1 FROM notifications WHERE tenant_id=$1 AND booking_id=$2",
          [context.id, recent],
        )
      ).rowCount,
    ).toBe(1);
    expect(
      (
        await harness.db.query(
          "SELECT actor_id FROM audit_events WHERE id=$1",
          [oldAudit],
        )
      ).rows[0].actor_id,
    ).toBeNull();
    expect(
      (
        await harness.db.query(
          "SELECT 1 FROM audit_events WHERE tenant_id=$1 AND resource_id=$2 AND action='booking.created' AND actor_id=$3",
          [context.id, recent, context.users.citizen],
        )
      ).rowCount,
    ).toBe(1);
    expect(
      (await harness.db.query("SELECT 1 FROM users WHERE id=$1", [removed]))
        .rowCount,
    ).toBe(0);
    const applied = await harness.db.query(
      "SELECT actor_id, actor_role, resource_id, details FROM audit_events WHERE tenant_id=$1 AND action='retention.applied'",
      [context.id],
    );
    expect(applied.rows).toHaveLength(1);
    expect(applied.rows[0]).toMatchObject({
      actor_id: null,
      actor_role: "system",
      resource_id: context.id,
      details: { bookingsDetached: 1, loginAttemptsPurged: 1, usersPurged: 1 },
    });
    const log = await context.manager
      .get("/v2/manager/audit")
      .query({ action: "retention.applied" })
      .expect(200);
    expect(log.body[0]).toMatchObject({
      actorId: null,
      actorRole: "system",
      actorName: null,
    });

    // The reservation invariant still holds after detaching rows.
    await post(context.citizen, "citizen/bookings", {
      id: randomUUID(),
      facilityId: court.id,
      start: start(2),
    }).expect(409);
  });
});
