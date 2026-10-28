// SPDX-License-Identifier: AGPL-3.0-or-later
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  createHmac,
  createPublicKey,
  randomUUID,
  verify,
  type JsonWebKey,
} from "node:crypto";
import { createServer, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import { createRequire } from "node:module";
import type { Type } from "@nestjs/common";
import request from "supertest";
import { Temporal } from "@js-temporal/polyfill";
import {
  type Tenant,
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
beforeAll(setup);
afterAll(teardown);
interface Claims {
  iss: string;
  sub: string;
  fac: string;
  nbf: number;
  exp: number;
}
function decode(token: string) {
  const [header, payload] = token.split(".");
  return {
    header: JSON.parse(Buffer.from(header, "base64url").toString()) as {
      kid: string;
      alg: string;
    },
    claims: JSON.parse(Buffer.from(payload, "base64url").toString()) as Claims,
  };
}
// Verifies exactly as an offline door device would: public JWK, ES256, raw r||s signature.
function verifies(token: string, keys: JsonWebKey[]) {
  const [header, payload, signature] = token.split(".");
  const { kid } = decode(token).header;
  const jwk = keys.find((key) => key.kid === kid);
  if (!jwk) return false;
  return verify(
    "sha256",
    Buffer.from(`${header}.${payload}`),
    {
      key: createPublicKey({ key: jwk, format: "jwk" }),
      dsaEncoding: "ieee-p1363",
    },
    Buffer.from(signature, "base64url"),
  );
}
// Access staff sign in like the other demo roles.
async function withAccessStaff(context: Tenant) {
  await harness.db.query(
    "INSERT INTO users (id,tenant_id,display_name,role) VALUES ($1,$2,'Brais · control de accesos','access')",
    [randomUUID(), context.id],
  );
  const access = request.agent(harness.app.getHttpServer());
  await post(access, "public/sessions", {
    slug: context.slug,
    role: "access",
  }).expect(201);
  return access;
}
// A reservation happening right now on its own court, inserted directly because the booking
// policy rejects the past.
async function bookingNow(context: Tenant) {
  const facilityId = (await facility(context)).id;
  const id = randomUUID();
  const now = Temporal.Now.instant();
  await harness.db.query(
    "INSERT INTO bookings (id,tenant_id,user_id,facility_id,resource_id,starts_at,ends_at,status,created_at) VALUES ($1,$2,$3,$4,$4,$5,$6,'confirmed',$7)",
    [
      id,
      context.id,
      context.users.citizen,
      facilityId,
      now.subtract({ minutes: 1 }).toString(),
      now.add({ minutes: 2 }).toString(),
      now.subtract({ hours: 1 }).toString(),
    ],
  );
  return id;
}
function localDate(instant: string) {
  return Temporal.Instant.from(instant)
    .toZonedDateTimeISO("Europe/Madrid")
    .toPlainDate()
    .toString();
}
describe("QR access passes, door checks and the access-control connector", () => {
  it("should sign a pass that verifies offline with the published keys for the booking's day", async () => {
    const context = await tenant();
    const court = await facility(context);
    const id = randomUUID();
    const begins = start(2, 18);
    await post(context.citizen, "citizen/bookings", {
      id,
      facilityId: court.id,
      start: begins,
    }).expect(201);
    const pass = (
      await post(
        context.citizen,
        `citizen/bookings/${id}/access-pass`,
        {},
      ).expect(200)
    ).body as { token: string; code: string; validFrom: string };
    const { keys } = (
      await request(harness.app.getHttpServer())
        .get(`/v2/public/municipalities/${context.slug}/jwks`)
        .expect(200)
    ).body as { keys: JsonWebKey[] };
    expect(verifies(pass.token, keys)).toBe(true);
    expect(verifies(`${pass.token.slice(0, -4)}AAAA`, keys)).toBe(false);
    const { header, claims } = decode(pass.token);
    expect(header.alg).toBe("ES256");
    const opening = Temporal.Instant.from(begins)
      .toZonedDateTimeISO("Europe/Madrid")
      .with({ hour: 9, minute: 0 })
      .toInstant();
    expect(claims).toMatchObject({
      iss: context.slug,
      sub: id,
      fac: court.id,
      seq: 0,
      nbf: opening.epochMilliseconds / 1000,
      exp:
        Temporal.Instant.from(begins).add({ hours: 1 }).epochMilliseconds /
        1000,
    });
    expect(pass.code).toBe(id.replaceAll("-", "").slice(0, 8).toUpperCase());
    const other = await tenant();
    await post(other.citizen, `citizen/bookings/${id}/access-pass`, {}).expect(
      404,
    );
  });
  it("should share one initial key between concurrent pass requests", async () => {
    const context = await tenant();
    const court = await facility(context);
    const id = randomUUID();
    await post(context.citizen, "citizen/bookings", {
      id,
      facilityId: court.id,
      start: start(2, 10),
    }).expect(201);
    const responses = await Promise.all(
      [0, 1].map(() =>
        post(context.citizen, `citizen/bookings/${id}/access-pass`, {}).expect(
          200,
        ),
      ),
    );
    expect(decode(responses[0].body.token).header.kid).toBe(
      decode(responses[1].body.token).header.kid,
    );
  });
  it("should list the day for the door and revoke a reservation once it is cancelled", async () => {
    const context = await tenant();
    const other = await tenant();
    const court = await facility(context);
    const access = await withAccessStaff(context);
    const otherAccess = await withAccessStaff(other);
    const id = randomUUID();
    const begins = start(2, 10);
    await post(context.citizen, "citizen/bookings", {
      id,
      facilityId: court.id,
      start: begins,
    }).expect(201);
    const day = (
      await access
        .get("/v2/access/day")
        .query({ date: localDate(begins) })
        .expect(200)
    ).body as {
      issuer: string;
      bookings: { id: string; holder: string; status: string }[];
      revoked: string[];
    };
    expect(day.issuer).toBe(context.slug);
    expect(day.bookings).toMatchObject([
      { id, holder: "citizen", status: "confirmed" },
    ]);
    expect(day.revoked).toEqual([]);
    await patch(context.citizen, `citizen/bookings/${id}`, {
      status: "cancelled",
    }).expect(204);
    const after = (
      await access
        .get("/v2/access/day")
        .query({ date: localDate(begins) })
        .expect(200)
    ).body as { revoked: string[] };
    expect(after.revoked).toEqual([id]);
    const isolated = (
      await otherAccess
        .get("/v2/access/day")
        .query({ date: localDate(begins) })
        .expect(200)
    ).body as { bookings: unknown[] };
    expect(isolated.bookings).toEqual([]);
  });
  it("should keep the retired key published after a rotation and sign new passes with the new one", async () => {
    const context = await tenant();
    const court = await facility(context);
    const id = randomUUID();
    await post(context.citizen, "citizen/bookings", {
      id,
      facilityId: court.id,
      start: start(2, 11),
    }).expect(201);
    const before = (
      await post(context.citizen, `citizen/bookings/${id}/access-pass`, {})
    ).body as { token: string };
    await post(context.manager, "manager/access-keys/rotation", {}).expect(201);
    await post(context.citizen, "manager/access-keys/rotation", {}).expect(403);
    const after = (
      await post(context.citizen, `citizen/bookings/${id}/access-pass`, {})
    ).body as { token: string };
    expect(decode(after.token).header.kid).not.toBe(
      decode(before.token).header.kid,
    );
    const { keys } = (
      await request(harness.app.getHttpServer()).get(
        `/v2/public/municipalities/${context.slug}/jwks`,
      )
    ).body as { keys: JsonWebKey[] };
    expect(keys).toHaveLength(2);
    expect(verifies(before.token, keys)).toBe(true);
    expect(verifies(after.token, keys)).toBe(true);
  });
  it("should record each entry once and refuse cancelled, other-day and unknown reservations", async () => {
    const context = await tenant();
    const court = await facility(context);
    const access = await withAccessStaff(context);
    const present = await bookingNow(context);
    const cancelled = await bookingNow(context);
    await harness.db.query(
      "UPDATE bookings SET status='cancelled', cancelled_at=now(), cancelled_by='citizen' WHERE id=$1",
      [cancelled],
    );
    const later = randomUUID();
    await post(context.citizen, "citizen/bookings", {
      id: later,
      facilityId: court.id,
      start: start(2, 12),
    }).expect(201);
    const now = Temporal.Now.instant().toString();
    const items = [present, present, cancelled, later, randomUUID()].map(
      (bookingId) => ({
        bookingId,
        sequence: 0,
        checkedInAt: now,
        method: "qr",
      }),
    );
    const { results } = (
      await post(access, "access/check-ins", { items }).expect(200)
    ).body as { results: { outcome: string }[] };
    expect(results.map((result) => result.outcome)).toEqual([
      "recorded",
      "duplicate",
      "cancelled",
      "out_of_window",
      "not_found",
    ]);
    // Someone who came in cannot be marked as absent.
    await patch(access, `manager/bookings/${present}`, {
      attendance: "no_show",
    }).expect(400);
    const absent = await bookingNow(context);
    await patch(access, `manager/bookings/${absent}`, {
      attendance: "no_show",
    }).expect(204);
    const audit = await harness.db.query(
      "SELECT count(*)::int AS n FROM audit_events WHERE tenant_id=$1 AND action='booking.checked_in'",
      [context.id],
    );
    expect(audit.rows[0].n).toBe(1);
  });
  it("should reject queued entries for a changed reservation and keep attendance per revision", async () => {
    const context = await tenant();
    const access = await withAccessStaff(context);
    const id = await bookingNow(context);
    const checkedInAt = Temporal.Now.instant().toString();
    const item = { bookingId: id, sequence: 0, checkedInAt, method: "qr" };
    const before = (
      await post(
        context.citizen,
        `citizen/bookings/${id}/access-pass`,
        {},
      ).expect(200)
    ).body;
    await post(access, "access/check-ins", { items: [item] })
      .expect(200)
      .expect(({ body }) => expect(body.results[0].outcome).toBe("recorded"));
    await harness.db.query(
      "UPDATE bookings SET ends_at=ends_at + interval '5 minutes' WHERE id=$1",
      [id],
    );
    const after = (
      await post(
        context.citizen,
        `citizen/bookings/${id}/access-pass`,
        {},
      ).expect(200)
    ).body;
    expect(decode(before.token).claims).toMatchObject({ seq: 0 });
    expect(decode(after.token).claims).toMatchObject({ seq: 1 });
    const synced = (await access.get("/v2/access/day").expect(200)).body;
    expect(
      synced.bookings.find((booking: { id: string }) => booking.id === id),
    ).toMatchObject({ sequence: 1, checkedInAt: null });
    await post(access, "access/check-ins", {
      items: [item, { ...item, sequence: 1 }],
    })
      .expect(200)
      .expect(({ body }) =>
        expect(body.results.map((r: { outcome: string }) => r.outcome)).toEqual(
          ["stale", "recorded"],
        ),
      );
    expect(
      (
        await harness.db.query(
          "SELECT count(*)::int AS n FROM check_ins WHERE booking_id=$1",
          [id],
        )
      ).rows[0].n,
    ).toBe(2);
  });
  it("should give access staff the door and nothing else", async () => {
    const context = await tenant();
    const court = await facility(context);
    const access = await withAccessStaff(context);
    const id = randomUUID();
    await post(context.citizen, "citizen/bookings", {
      id,
      facilityId: court.id,
      start: start(2, 13),
    }).expect(201);
    await patch(access, `manager/bookings/${id}`, {
      status: "cancelled",
      reason: "Proba",
    }).expect(403);
    await post(access, "manager/facilities", {
      ...court,
      id: randomUUID(),
    }).expect(403);
    await access.get("/v2/manager/audit").expect(403);
    await access.get("/v2/manager/access-settings").expect(403);
    await access.get("/v2/manager/insights").expect(403);
    await context.citizen.get("/v2/access/day").expect(403);
    await post(context.citizen, "access/check-ins", {
      items: [
        {
          bookingId: id,
          sequence: 0,
          checkedInAt: Temporal.Now.instant().toString(),
          method: "qr",
        },
      ],
    }).expect(403);
  });
  it("should call the council's access system with signed grant and revoke events", async () => {
    const received: { body: string; signature: string; delivery: string }[] =
      [];
    const server: Server = createServer((req, res) => {
      const chunks: Buffer[] = [];
      req.on("data", (chunk: Buffer) => chunks.push(chunk));
      req.on("end", () => {
        received.push({
          body: Buffer.concat(chunks).toString(),
          signature: String(req.headers["x-quenda-signature"]),
          delivery: String(req.headers["x-quenda-delivery"]),
        });
        res.writeHead(200).end();
      });
    });
    await new Promise<void>((resolve) =>
      server.listen(0, "127.0.0.1", resolve),
    );
    try {
      const context = await tenant();
      const quiet = await tenant();
      const court = await facility(context);
      const quietCourt = await facility(quiet);
      const url = `http://127.0.0.1:${(server.address() as AddressInfo).port}/hook`;
      await harness.db.query(
        "UPDATE outbox SET sent_at=now() WHERE sent_at IS NULL",
      );
      const configured = (
        await context.manager
          .put("/v2/manager/access-webhook")
          .set("X-Quenda-Request", "1")
          .send({ url })
          .expect(200)
      ).body as { secret: string };
      expect(configured.secret).toMatch(/^[0-9a-f]{64}$/);
      const settings = (
        await context.manager.get("/v2/manager/access-settings").expect(200)
      ).body as { webhookUrl: string; hasWebhookSecret: boolean };
      expect(settings).toMatchObject({
        webhookUrl: url,
        hasWebhookSecret: true,
      });
      const { DeliveryWorker } =
        require("../dist/v2/modules/notifications/infrastructure/worker/delivery-worker.js") as {
          DeliveryWorker: Type<{ runOnce(): Promise<unknown> }>;
        };
      const worker = harness.app.get(DeliveryWorker);
      const id = randomUUID();
      await post(context.citizen, "citizen/bookings", {
        id,
        facilityId: court.id,
        start: start(2, 14),
      }).expect(201);
      await worker.runOnce();
      await patch(context.citizen, `citizen/bookings/${id}`, {
        status: "cancelled",
      }).expect(204);
      // A municipality without a connector queues no webhook at all.
      await post(quiet.citizen, "citizen/bookings", {
        id: randomUUID(),
        facilityId: quietCourt.id,
        start: start(2, 14),
      }).expect(201);
      const queued = await harness.db.query(
        "SELECT tenant_id FROM outbox WHERE channel='webhook' AND sent_at IS NULL",
      );
      expect(queued.rows.map((row) => row.tenant_id)).toEqual([context.id]);
      await worker.runOnce();
      const events = received.map((call) => {
        expect(call.signature).toBe(
          `sha256=${createHmac("sha256", configured.secret).update(call.body).digest("hex")}`,
        );
        return JSON.parse(call.body) as { event: string; bookingId: string };
      });
      expect(events).toMatchObject([
        { event: "credential.granted", bookingId: id },
        { event: "credential.revoked", bookingId: id },
      ]);
      expect(new Set(received.map((call) => call.delivery)).size).toBe(2);
      expect(JSON.stringify(events)).not.toContain("citizen");
    } finally {
      await new Promise((resolve) => server.close(resolve));
    }
  });
});
