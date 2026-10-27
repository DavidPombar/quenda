// SPDX-License-Identifier: AGPL-3.0-or-later
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { randomUUID } from "node:crypto";
import { createRequire } from "node:module";
import type { Type } from "@nestjs/common";
import request from "supertest";
import {
  type Agent,
  type Tenant,
  del,
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
interface Folded<T> {
  fold<R>(ok: (value: T) => R, err: (error: unknown) => R): R;
}
interface Locator {
  get<A, T>(type: Type): { execute(args: A): Promise<Folded<T>> };
}
interface ClaimedDelivery {
  id: string;
  tenantId: string;
  kind: string;
  attempts: number;
  email: string | null;
  locale: string;
}
// Loaded lazily: the compiled modules read DATABASE_URL, which setup() points at the test database.
function compiled() {
  const load = <T>(path: string) => require(`../dist/${path}.js`) as T;
  const { Commands } = load<{ Commands: Type<Locator> }>(
    "v2/shared/infrastructure/commands.locator",
  );
  const { UnsubscribeTokens } = load<{ UnsubscribeTokens: Type }>(
    "v2/shared/application/unsubscribe-tokens",
  );
  const commands = harness.app.get(Commands);
  const command = (path: string, name: string) =>
    commands.get(load<Record<string, Type>>(path)[name]);
  return {
    scheduleReminders: (tenantId: string) =>
      command(
        "v2/modules/notifications/application/commands/schedule-reminders.command",
        "ScheduleReminders",
      ).execute({ tenantId }) as Promise<Folded<number>>,
    claim: (limit = 50) =>
      command(
        "v2/modules/notifications/application/commands/claim-deliveries.command",
        "ClaimDeliveries",
      ).execute({ limit }) as Promise<Folded<ClaimedDelivery[]>>,
    complete: (args: { id: string; attempts: number; error?: string }) =>
      command(
        "v2/modules/notifications/application/commands/complete-delivery.command",
        "CompleteDelivery",
      ).execute(args) as Promise<Folded<void>>,
    tokens: harness.app.get(UnsubscribeTokens) as {
      sign(target: object): string;
    },
  };
}
function value<T>(result: Folded<T>): T {
  return result.fold(
    (ok) => ok,
    (error) => {
      throw new Error(JSON.stringify(error));
    },
  );
}
function put(agent: Agent, path: string, body: unknown) {
  return agent.put(`/v2/${path}`).set("X-Quenda-Request", "1").send(body);
}
async function messages(context: Tenant) {
  return (
    await harness.db.query<{
      kind: string;
      booking_id: string;
      sent_at: string | null;
      attempts: number;
      last_error: string | null;
    }>(
      "SELECT kind, booking_id, sent_at, attempts, last_error FROM outbox WHERE tenant_id=$1 ORDER BY created_at",
      [context.id],
    )
  ).rows;
}
async function withEmail() {
  const context = await tenant();
  await harness.db.query("UPDATE users SET email=$2 WHERE id=$1", [
    context.users.citizen,
    `citizen@${context.slug}.example`,
  ]);
  return context;
}
// Makes a reservation look as if it had been made days ago, before its reminder window opened.
async function bookedEarlier(id: string) {
  await harness.db.query(
    "UPDATE bookings SET created_at = starts_at - interval '7 days' WHERE id=$1",
    [id],
  );
}
async function closeOutbox() {
  await harness.db.query(
    "UPDATE outbox SET sent_at=now() WHERE sent_at IS NULL",
  );
}
beforeAll(setup);
afterAll(teardown);
describe("Email notices through the transactional outbox", () => {
  it("should queue one message per booking change and none when the change is rejected", async () => {
    const context = await withEmail();
    const court = await facility(context);
    const id = randomUUID();
    await post(context.citizen, "citizen/bookings", {
      id,
      facilityId: court.id,
      start: start(3, 10),
    }).expect(201);
    await post(context.citizen, "citizen/bookings", {
      id: randomUUID(),
      facilityId: court.id,
      start: start(3, 10),
    }).expect(409);
    expect((await messages(context)).map((row) => row.kind)).toEqual([
      "confirmed",
    ]);
    await patch(context.citizen, `citizen/bookings/${id}`, {
      start: start(3, 12),
    }).expect(204);
    await patch(context.citizen, `citizen/bookings/${id}`, {
      status: "cancelled",
    }).expect(204);
    expect((await messages(context)).map((row) => row.kind)).toEqual([
      "confirmed",
      "rescheduled",
      "cancelled",
    ]);
  });
  it("should lease each message to a single worker and retry a failed delivery later", async () => {
    await closeOutbox();
    const context = await withEmail();
    const court = await facility(context);
    for (const hour of [10, 11, 12])
      await post(context.citizen, "citizen/bookings", {
        id: randomUUID(),
        facilityId: court.id,
        start: start(3, hour),
      }).expect(201);
    await patch(context.citizen, "citizen/me", { locale: "es" }).expect(204);
    const { claim, complete } = compiled();
    const [first, second] = (await Promise.all([claim(2), claim(2)])).map(
      value,
    );
    const ids = [...first, ...second].map((delivery) => delivery.id);
    expect(ids).toHaveLength(3);
    expect(new Set(ids).size).toBe(3);
    expect(value(await claim())).toEqual([]);
    const delivery = first[0];
    expect(delivery).toMatchObject({
      tenantId: context.id,
      email: `citizen@${context.slug}.example`,
      locale: "es",
      attempts: 1,
    });
    value(
      await complete({
        id: delivery.id,
        attempts: delivery.attempts,
        error: "connection refused",
      }),
    );
    for (const other of [...first.slice(1), ...second])
      value(await complete({ id: other.id, attempts: other.attempts }));
    const rows = await messages(context);
    expect(rows.filter((row) => row.sent_at !== null)).toHaveLength(2);
    expect(rows.find((row) => row.sent_at === null)).toMatchObject({
      attempts: 1,
      last_error: "connection refused",
    });
    // The failed message waits for its backoff before it is offered again.
    expect(value(await claim())).toEqual([]);
  });
  it("should close messages without sending when the person has no email address", async () => {
    await closeOutbox();
    const context = await tenant();
    const court = await facility(context);
    await post(context.citizen, "citizen/bookings", {
      id: randomUUID(),
      facilityId: court.id,
      start: start(3, 10),
    }).expect(201);
    expect(value(await compiled().claim())).toEqual([]);
    expect(await messages(context)).toMatchObject([
      { kind: "confirmed", last_error: "skipped:no_recipient" },
    ]);
  });
  it("should queue exactly one reminder per reservation even when the worker runs again", async () => {
    await closeOutbox();
    const context = await withEmail();
    const other = await withEmail();
    await harness.db.query(
      "UPDATE municipalities SET reminder_hours=72 WHERE id = ANY($1)",
      [[context.id, other.id]],
    );
    const court = await facility(context);
    const otherCourt = await facility(other);
    const id = randomUUID();
    const late = randomUUID();
    await post(context.citizen, "citizen/bookings", {
      id,
      facilityId: court.id,
      start: start(2, 10),
    }).expect(201);
    // Booked inside the window: the confirmation is enough, no reminder follows.
    await post(context.citizen, "citizen/bookings", {
      id: late,
      facilityId: court.id,
      start: start(2, 12),
    }).expect(201);
    const otherBooking = randomUUID();
    await post(other.citizen, "citizen/bookings", {
      id: otherBooking,
      facilityId: otherCourt.id,
      start: start(2, 10),
    }).expect(201);
    await bookedEarlier(id);
    await bookedEarlier(otherBooking);
    const { scheduleReminders } = compiled();
    expect(value(await scheduleReminders(context.id))).toBe(1);
    expect(value(await scheduleReminders(context.id))).toBe(0);
    // A fresh pass after a restart finds the same dedupe key and queues nothing.
    expect(value(await scheduleReminders(context.id))).toBe(0);
    const reminders = (await messages(context)).filter(
      (row) => row.kind === "reminder",
    );
    expect(reminders.map((row) => row.booking_id)).toEqual([id]);
    // The other municipality is untouched until its own pass.
    expect(
      (await messages(other)).filter((row) => row.kind === "reminder"),
    ).toEqual([]);
    const notices = await context.citizen
      .get("/v2/citizen/notifications")
      .expect(200);
    expect(
      (notices.body as { kind: string; bookingId: string }[]).filter(
        (notice) => notice.kind === "reminder",
      ),
    ).toMatchObject([{ bookingId: id }]);
  });
  it("should not remind people who switched reminders off, from the account or from the email link", async () => {
    await closeOutbox();
    const context = await withEmail();
    await harness.db.query(
      "UPDATE municipalities SET reminder_hours=72 WHERE id=$1",
      [context.id],
    );
    const court = await facility(context);
    const id = randomUUID();
    await post(context.citizen, "citizen/bookings", {
      id,
      facilityId: court.id,
      start: start(2, 10),
    }).expect(201);
    await bookedEarlier(id);
    await put(context.citizen, "citizen/me/notification-preferences", {
      reminderEmails: false,
    }).expect(204);
    const account = await context.citizen.get("/v2/citizen/me").expect(200);
    expect(account.body).toMatchObject({
      email: `citizen@${context.slug}.example`,
      reminderEmails: false,
    });
    const { scheduleReminders, tokens } = compiled();
    expect(value(await scheduleReminders(context.id))).toBe(0);
    await put(context.citizen, "citizen/me/notification-preferences", {
      reminderEmails: true,
    }).expect(204);
    const anonymous = request.agent(harness.app.getHttpServer());
    const token = tokens.sign({
      tenantId: context.id,
      userId: context.users.citizen,
      kind: "reminder",
      channel: "email",
    });
    await post(anonymous, "public/unsubscribe", { token }).expect(204);
    await post(anonymous, "public/unsubscribe", { token }).expect(204);
    await post(anonymous, "public/unsubscribe", {
      token: `${token.slice(0, -2)}xx`,
    }).expect(400);
    expect(
      (await context.citizen.get("/v2/citizen/me").expect(200)).body
        .reminderEmails,
    ).toBe(false);
    expect(value(await scheduleReminders(context.id))).toBe(0);
    const audit = await harness.db.query<{ action: string }>(
      "SELECT action FROM audit_events WHERE tenant_id=$1 AND action LIKE 'notification_preferences.%' ORDER BY occurred_at",
      [context.id],
    );
    expect(audit.rows.map((row) => row.action)).toEqual([
      "notification_preferences.updated",
      "notification_preferences.updated",
      "notification_preferences.unsubscribed",
    ]);
  });
  it("should export the address and messages and erase them with the account", async () => {
    const context = await withEmail();
    const court = await facility(context);
    await post(context.citizen, "citizen/bookings", {
      id: randomUUID(),
      facilityId: court.id,
      start: start(3, 10),
    }).expect(201);
    await patch(context.citizen, "citizen/me", { locale: "gl" }).expect(204);
    await patch(context.citizen, "citizen/me", { locale: "fr" }).expect(400);
    const exported = await context.citizen
      .get("/v2/citizen/me/export")
      .expect(200);
    expect(exported.body).toMatchObject({
      profile: { email: `citizen@${context.slug}.example`, locale: "gl" },
      preferences: { reminderEmails: true },
      messages: [{ kind: "confirmed", channel: "email" }],
    });
    await del(context.citizen, "citizen/me").expect(204);
    expect(await messages(context)).toEqual([]);
    const user = await harness.db.query(
      "SELECT email, locale FROM users WHERE id=$1",
      [context.users.citizen],
    );
    expect(user.rows[0]).toEqual({ email: null, locale: null });
  });
});
