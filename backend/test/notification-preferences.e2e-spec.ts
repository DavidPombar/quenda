// SPDX-License-Identifier: AGPL-3.0-or-later
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createECDH, randomBytes, randomUUID } from "node:crypto";
import { createRequire } from "node:module";
import { type AddressInfo } from "node:net";
import { createServer, type IncomingHttpHeaders, type Server } from "node:http";
import type { Type } from "@nestjs/common";
import { Temporal } from "@js-temporal/polyfill";
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
type Preferences = Record<string, { email: boolean; push: boolean }>;
interface Settings {
  preferences: Preferences;
  push: { available: boolean; publicKey: string | null; devices: number };
}
function put(agent: Agent, path: string, body: unknown) {
  return agent.put(`/v2/${path}`).set("X-Quenda-Request", "1").send(body);
}
function remove(agent: Agent, path: string, body: unknown) {
  return agent.delete(`/v2/${path}`).set("X-Quenda-Request", "1").send(body);
}
async function settings(context: Tenant) {
  return (
    await context.citizen
      .get("/v2/citizen/me/notification-preferences")
      .expect(200)
  ).body as Settings;
}
async function choose(context: Tenant, changes: Preferences) {
  const current = await settings(context);
  await put(context.citizen, "citizen/me/notification-preferences", {
    ...current.preferences,
    ...changes,
  }).expect(204);
}
/** A browser subscription: a real P-256 key and secret, so the payload is really encrypted. */
function subscription(endpoint: string) {
  const ecdh = createECDH("prime256v1");
  ecdh.generateKeys();
  return {
    endpoint,
    keys: {
      p256dh: ecdh.getPublicKey().toString("base64url"),
      auth: randomBytes(16).toString("base64url"),
    },
  };
}
async function messages(context: Tenant) {
  return (
    await harness.db.query<{
      kind: string;
      channel: string;
      sent_at: string | null;
      last_error: string | null;
    }>(
      "SELECT kind, channel, sent_at, last_error FROM outbox WHERE tenant_id=$1 ORDER BY created_at, channel",
      [context.id],
    )
  ).rows;
}
async function closeOutbox() {
  await harness.db.query(
    "UPDATE outbox SET sent_at=now() WHERE sent_at IS NULL",
  );
}
function worker() {
  const { DeliveryWorker } =
    require("../dist/v2/modules/notifications/infrastructure/worker/delivery-worker.js") as {
      DeliveryWorker: Type<{ runOnce(): Promise<unknown> }>;
    };
  return harness.app.get(DeliveryWorker);
}
/** Stands in for a browser's push service: 410 for paths under /gone, 201 otherwise. */
function pushService() {
  const received: { path: string; headers: IncomingHttpHeaders }[] = [];
  const server: Server = createServer((req, res) => {
    req.resume();
    req.on("end", () => {
      received.push({ path: req.url ?? "", headers: req.headers });
      res.writeHead(req.url?.startsWith("/gone") ? 410 : 201).end();
    });
  });
  return {
    received,
    async listen() {
      await new Promise<void>((resolve) =>
        server.listen(0, "127.0.0.1", resolve),
      );
      return `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
    },
    close: () => new Promise((resolve) => server.close(resolve)),
  };
}
// Past reservations cannot be made through the API, so they are written as installed history.
async function startedToday(context: Tenant, facilityId: string) {
  const id = randomUUID();
  const now = Temporal.Now.zonedDateTimeISO("Europe/Madrid");
  const earlier = now.subtract({ minutes: 30 });
  const begins = (
    earlier.toPlainDate().equals(now.toPlainDate()) ? earlier : now.startOfDay()
  ).toInstant();
  await harness.db.query(
    `WITH booking AS (
      INSERT INTO bookings (id,tenant_id,user_id,facility_id,resource_id,starts_at,ends_at,status,created_at)
      VALUES ($1,$2,$3,$4,$4,$5,$6,'confirmed',$7) RETURNING id
    )
    INSERT INTO booking_units (tenant_id,booking_id,unit_id,starts_at,ends_at)
    SELECT $2,id,$4,$5,$6 FROM booking`,
    [
      id,
      context.id,
      context.users.citizen,
      facilityId,
      begins.toString(),
      begins.add({ minutes: 60 }).toString(),
      begins.subtract({ hours: 48 }).toString(),
    ],
  );
  return id;
}
beforeAll(setup);
afterAll(teardown);
describe("Notice preferences per kind and channel, and Web Push", () => {
  it("should start from the defaults and store and audit only the choices that change", async () => {
    const context = await tenant();
    const initial = await settings(context);
    expect(initial.preferences).toEqual({
      confirmation: { email: true, push: true },
      change: { email: true, push: true },
      cancellation: { email: true, push: true },
      reminder: { email: true, push: true },
      penalty: { email: false, push: false },
    });
    expect(initial.push).toMatchObject({ available: true, devices: 0 });
    expect(initial.push.publicKey).toMatch(/^[A-Za-z0-9_-]{80,}$/);
    await choose(context, { reminder: { email: false, push: true } });
    await choose(context, { reminder: { email: false, push: true } });
    expect((await settings(context)).preferences.reminder).toEqual({
      email: false,
      push: true,
    });
    const { reminder, ...incomplete } = initial.preferences;
    expect(reminder).toBeDefined();
    await put(
      context.citizen,
      "citizen/me/notification-preferences",
      incomplete,
    ).expect(400);
    const audit = await harness.db.query<{
      details: Record<string, unknown>;
    }>(
      "SELECT details FROM audit_events WHERE tenant_id=$1 AND action='notification_preferences.updated'",
      [context.id],
    );
    expect(audit.rows.map((row) => row.details)).toEqual([
      { "reminder.email": false },
    ]);
  });
  it("should keep devices and choices apart between municipalities", async () => {
    const one = await tenant();
    const two = await tenant();
    const device = subscription("https://push.example.org/send/shared");
    await post(one.citizen, "citizen/me/push-subscriptions", device).expect(
      204,
    );
    await post(two.citizen, "citizen/me/push-subscriptions", device).expect(
      204,
    );
    await choose(one, { change: { email: false, push: false } });
    expect((await settings(two)).preferences.change).toEqual({
      email: true,
      push: true,
    });
    await remove(one.citizen, "citizen/me/push-subscriptions", {
      endpoint: device.endpoint,
    }).expect(204);
    expect((await settings(one)).push.devices).toBe(0);
    expect((await settings(two)).push.devices).toBe(1);
    await post(
      one.citizen,
      "citizen/me/push-subscriptions",
      subscription("http://push.example.org/send/plain"),
    ).expect(400);
    const anonymous = request.agent(harness.app.getHttpServer());
    await anonymous.get("/v2/citizen/me/notification-preferences").expect(401);
  });
  it("should push only to people who want it and forget devices the push service no longer knows", async () => {
    await closeOutbox();
    const service = pushService();
    const base = await service.listen();
    try {
      const context = await tenant();
      await harness.db.query(
        "UPDATE municipalities SET reminder_hours=72 WHERE id=$1",
        [context.id],
      );
      const court = await facility(context);
      // Push on, but no device yet: nothing is queued for push.
      await post(context.citizen, "citizen/bookings", {
        id: randomUUID(),
        facilityId: court.id,
        start: start(4, 10),
      }).expect(201);
      expect(
        (await messages(context)).filter((row) => row.channel === "push"),
      ).toEqual([]);
      for (const path of ["/ok/1", "/gone/1"])
        await post(
          context.citizen,
          "citizen/me/push-subscriptions",
          subscription(`${base}${path}`),
        ).expect(204);
      await choose(context, { reminder: { email: false, push: true } });
      const id = randomUUID();
      await post(context.citizen, "citizen/bookings", {
        id,
        facilityId: court.id,
        start: start(2, 10),
      }).expect(201);
      await harness.db.query(
        "UPDATE bookings SET created_at = starts_at - interval '7 days' WHERE id=$1",
        [id],
      );
      await worker().runOnce();
      expect(service.received.map((call) => call.path).sort()).toEqual([
        "/gone/1",
        "/ok/1",
        "/ok/1",
      ]);
      const [first] = service.received;
      expect(first.headers).toMatchObject({
        "content-encoding": "aes128gcm",
        ttl: "86400",
      });
      expect(first.headers.authorization).toMatch(/^vapid t=.+, k=.+/);
      expect(String(first.headers.topic)).toMatch(/^[A-Za-z0-9_-]{1,32}$/);
      expect((await settings(context)).push.devices).toBe(1);
      const rows = await messages(context);
      // The reminder goes out only by push; the confirmation by both (no address: email closes).
      expect(
        rows.filter((row) => row.kind === "reminder").map((row) => row.channel),
      ).toEqual(["push"]);
      expect(
        rows.filter((row) => row.channel === "push" && row.sent_at === null),
      ).toEqual([]);
      expect(
        rows
          .filter((row) => row.channel === "push")
          .map((row) => row.last_error),
      ).toEqual([null, null]);
      // Switched off after it was queued: closed without sending.
      await patch(context.citizen, `citizen/bookings/${id}`, {
        start: start(2, 12),
      }).expect(204);
      // The new time would get its own reminder; with reminder pushes off it is not queued.
      await choose(context, {
        change: { email: true, push: false },
        reminder: { email: false, push: false },
      });
      await worker().runOnce();
      expect(service.received).toHaveLength(3);
      expect(
        (await messages(context)).find(
          (row) => row.kind === "rescheduled" && row.channel === "push",
        ),
      ).toMatchObject({ last_error: "skipped:preference" });
      await choose(context, { cancellation: { email: true, push: false } });
      await patch(context.citizen, `citizen/bookings/${id}`, {
        status: "cancelled",
      }).expect(204);
      expect(
        (await messages(context)).filter(
          (row) => row.kind === "cancelled" && row.channel === "push",
        ),
      ).toEqual([]);
    } finally {
      await service.close();
    }
  });
  it("should email penalty notices only to people who asked for them", async () => {
    const context = await tenant();
    await harness.db.query("UPDATE users SET email=$2 WHERE id=$1", [
      context.users.citizen,
      `citizen@${context.slug}.example`,
    ]);
    const first = await startedToday(context, (await facility(context)).id);
    const second = await startedToday(context, (await facility(context)).id);
    await patch(context.manager, `manager/bookings/${first}`, {
      attendance: "no_show",
    }).expect(204);
    expect(
      (await messages(context)).filter((row) => row.kind === "no_show"),
    ).toEqual([]);
    await choose(context, { penalty: { email: true, push: false } });
    await patch(context.manager, `manager/bookings/${second}`, {
      attendance: "no_show",
    }).expect(204);
    expect(
      (await messages(context))
        .filter((row) => row.kind === "no_show")
        .map((row) => row.channel),
    ).toEqual(["email"]);
  });
  it("should switch one notice off from the email link, but not after the person turns it back on", async () => {
    const context = await tenant();
    const { UnsubscribeTokens } =
      require("../dist/v2/shared/application/unsubscribe-tokens.js") as {
        UnsubscribeTokens: Type;
      };
    const tokens = harness.app.get(UnsubscribeTokens) as {
      sign(target: object): string;
    };
    const target = {
      tenantId: context.id,
      userId: context.users.citizen,
      kind: "change",
      channel: "email",
    };
    const token = tokens.sign({ ...target, version: "0" });
    const anonymous = request.agent(harness.app.getHttpServer());
    expect(
      (await post(anonymous, "public/unsubscribe", { token }).expect(200)).body,
    ).toEqual({ kind: "change" });
    await post(anonymous, "public/unsubscribe", { token }).expect(200);
    expect((await settings(context)).preferences.change).toEqual({
      email: false,
      push: true,
    });
    await choose(context, { change: { email: true, push: true } });
    expect(
      (await post(anonymous, "public/unsubscribe", { token }).expect(410)).body
        .code,
    ).toBe("unsubscribe_stale");
    const version = (
      await harness.db.query<{ version: string }>(
        "SELECT floor(extract(epoch FROM updated_at) * 1000)::bigint::text AS version FROM notification_preferences WHERE user_id=$1 AND kind='change' AND channel='email'",
        [context.users.citizen],
      )
    ).rows[0].version;
    await post(anonymous, "public/unsubscribe", {
      token: tokens.sign({ ...target, version }),
    }).expect(200);
    await post(anonymous, "public/unsubscribe", {
      token: `${token.slice(0, -2)}xx`,
    }).expect(400);
    expect((await settings(context)).preferences.change.email).toBe(false);
    const audit = await harness.db.query<{ action: string }>(
      "SELECT action FROM audit_events WHERE tenant_id=$1 AND action LIKE 'notification_preferences.%' ORDER BY occurred_at",
      [context.id],
    );
    expect(audit.rows.map((row) => row.action)).toEqual([
      "notification_preferences.unsubscribed",
      "notification_preferences.updated",
      "notification_preferences.unsubscribed",
    ]);
  });
  it("should export choices and devices without their credentials and erase them with the account", async () => {
    const context = await tenant();
    const device = subscription("https://push.example.org/send/secret-path");
    await post(context.citizen, "citizen/me/push-subscriptions", device).expect(
      204,
    );
    await choose(context, { penalty: { email: false, push: true } });
    const exported = await context.citizen
      .get("/v2/citizen/me/export")
      .expect(200);
    expect(exported.body).toMatchObject({
      preferences: { penalty: { email: false, push: true } },
      pushDevices: [{ service: "https://push.example.org" }],
    });
    expect(JSON.stringify(exported.body)).not.toContain("secret-path");
    expect(JSON.stringify(exported.body)).not.toContain(device.keys.auth);
    await del(context.citizen, "citizen/me").expect(204);
    const left = await harness.db.query(
      "SELECT 1 FROM push_subscriptions WHERE tenant_id=$1 UNION ALL SELECT 1 FROM notification_preferences WHERE tenant_id=$1",
      [context.id],
    );
    expect(left.rows).toEqual([]);
  });
});
