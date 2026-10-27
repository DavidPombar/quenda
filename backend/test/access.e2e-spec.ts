// SPDX-License-Identifier: AGPL-3.0-or-later
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createHmac, createPublicKey, randomUUID, verify } from "node:crypto";
import { createServer, IncomingHttpHeaders } from "node:http";
import { createRequire } from "node:module";
import type { AddressInfo } from "node:net";
import request from "supertest";
import { Temporal } from "@js-temporal/polyfill";
import {
  Agent,
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
// The app under test is the compiled build, so its providers are looked up with dist classes,
// loaded only after setup() has pointed the configuration at the disposable database.
const require = createRequire(import.meta.url);
function compiled<T>(path: string) {
  return require(`../dist/v2/modules/access/${path}.js`) as T;
}
beforeAll(setup);
afterAll(teardown);
const zone = "Europe/Madrid";
type Credential = { token: string; keyId: string; notBefore: string };
/** A slot that has already started today, local time. */
function startedToday() {
  const now = Temporal.Now.zonedDateTimeISO(zone);
  const earlier = now.subtract({ minutes: 30 });
  return (
    earlier.toPlainDate().equals(now.toPlainDate()) ? earlier : now.startOfDay()
  ).toInstant();
}
function today() {
  return Temporal.Now.zonedDateTimeISO(zone).toPlainDate().toString();
}
// Started bookings cannot be made through the API, so they are written as installed history.
async function booking(
  context: Tenant,
  facilityId: string,
  begins: Temporal.Instant,
  minutes = 60,
) {
  const id = randomUUID();
  await harness.db.query(
    "INSERT INTO bookings (id,tenant_id,user_id,facility_id,starts_at,ends_at,status,created_at) VALUES ($1,$2,$3,$4,$5,$6,'confirmed',$7)",
    [
      id,
      context.id,
      context.users.citizen,
      facilityId,
      begins.toString(),
      begins.add({ minutes }).toString(),
      begins.subtract({ hours: 48 }).toString(),
    ],
  );
  return id;
}
async function staff(context: Tenant) {
  await harness.db.query("INSERT INTO users VALUES ($1,$2,$3,$4)", [
    randomUUID(),
    context.id,
    "Door staff",
    "staff",
  ]);
  const agent = request.agent(harness.app.getHttpServer());
  await post(agent, "public/sessions", {
    slug: context.slug,
    role: "staff",
  }).expect(201);
  return agent;
}
async function credential(agent: Agent, id: string) {
  return (await agent.get(`/v2/citizen/bookings/${id}/credential`).expect(200))
    .body as Credential;
}
function claims(token: string) {
  return JSON.parse(
    Buffer.from(token.split(".")[1], "base64url").toString(),
  ) as Record<string, unknown>;
}
function checkIn(agent: Agent, token: string, scannedAt?: string) {
  return post(agent, "access/check-ins", { token, scannedAt });
}
describe("Access control with signed QR credentials", () => {
  it("should issue a signed credential that door devices verify offline with the published key", async () => {
    const context = await tenant();
    const court = await facility(context);
    const ongoing = await booking(context, court.id, startedToday());
    const door = await staff(context);
    const issued = await credential(context.citizen, ongoing);
    expect(claims(issued.token)).toMatchObject({
      iss: context.slug,
      sub: ongoing,
      fac: court.id,
    });
    const published = (await door.get("/v2/access/keys").expect(200)).body as {
      issuer: string;
      keys: { kid: string; x: string; crv: string; fingerprint: string }[];
    };
    expect(published.issuer).toBe(context.slug);
    expect(published.keys).toHaveLength(1);
    expect(published.keys[0]).toMatchObject({
      kid: issued.keyId,
      crv: "Ed25519",
    });
    const [header, payload, signature] = issued.token.split(".");
    expect(
      verify(
        null,
        Buffer.from(`${header}.${payload}`),
        createPublicKey({
          key: { kty: "OKP", crv: "Ed25519", x: published.keys[0].x },
          format: "jwk",
        }),
        Buffer.from(signature, "base64url"),
      ),
    ).toBe(true);
    // The window opens with the space that day (09:00) unless the booking itself starts earlier.
    const begins = Temporal.Instant.from(
      (
        await harness.db.query<{ starts_at: string }>(
          "SELECT starts_at FROM bookings WHERE id=$1",
          [ongoing],
        )
      ).rows[0].starts_at,
    );
    const opening = begins
      .toZonedDateTimeISO(zone)
      .toPlainDate()
      .toZonedDateTime({ timeZone: zone, plainTime: "09:00" })
      .toInstant();
    expect(Temporal.Instant.from(issued.notBefore).toString()).toBe(
      (Temporal.Instant.compare(opening, begins) <= 0
        ? opening
        : begins
      ).toString(),
    );
    const stored = (
      await harness.db.query<{ encrypted_private_key: Buffer }>(
        "SELECT encrypted_private_key FROM municipality_signing_keys WHERE tenant_id=$1",
        [context.id],
      )
    ).rows[0].encrypted_private_key;
    // An Ed25519 PKCS#8 key would start with this prefix; it is sealed instead.
    expect(stored.toString("hex")).not.toContain(
      "302e020100300506032b657004220420",
    );
    const stranger = await tenant();
    await stranger.citizen
      .get(`/v2/citizen/bookings/${ongoing}/credential`)
      .expect(404);
    await context.citizen.get("/v2/access/keys").expect(403);
  });
  it("should check people in once inside the window and refuse forged, foreign, early or late credentials", async () => {
    const context = await tenant();
    const court = await facility(context);
    const door = await staff(context);
    const ongoing = await booking(context, court.id, startedToday());
    const issued = await credential(context.citizen, ongoing);
    await checkIn(context.citizen, issued.token).expect(403);
    const first = (await checkIn(door, issued.token).expect(200)).body as {
      bookingId: string;
      displayName: string;
      alreadyCheckedIn: boolean;
    };
    expect(first).toMatchObject({
      bookingId: ongoing,
      displayName: "citizen",
      alreadyCheckedIn: false,
    });
    expect(
      (await checkIn(door, issued.token).expect(200)).body.alreadyCheckedIn,
    ).toBe(true);
    const [header, payload, signature] = issued.token.split(".");
    const forged = `${header}.${Buffer.from(
      JSON.stringify({ ...claims(issued.token), exp: 4102444800 }),
    ).toString("base64url")}.${signature}`;
    expect((await checkIn(door, forged).expect(422)).body.code).toBe(
      "invalid_credential",
    );
    expect(
      (await checkIn(door, `${header}.${payload}.AAAA`).expect(422)).body.code,
    ).toBe("invalid_credential");
    const elsewhere = await tenant();
    const foreignCourt = await facility(elsewhere);
    const foreign = await credential(
      elsewhere.citizen,
      await booking(elsewhere, foreignCourt.id, startedToday()),
    );
    expect((await checkIn(door, foreign.token).expect(422)).body.code).toBe(
      "invalid_credential",
    );
    const later = await post(context.citizen, "citizen/bookings", {
      id: randomUUID(),
      facilityId: court.id,
      start: start(2, 10),
    }).expect(201);
    const early = await credential(context.citizen, later.body.id as string);
    expect((await checkIn(door, early.token).expect(422)).body.code).toBe(
      "credential_not_yet_valid",
    );
    // Ended bookings get no QR; a credential kept from before expires with the booking.
    const ended = await booking(
      context,
      court.id,
      Temporal.Now.instant().subtract({ hours: 3 }),
    );
    expect(
      (
        await context.citizen
          .get(`/v2/citizen/bookings/${ended}/credential`)
          .expect(422)
      ).body.code,
    ).toBe("credential_unavailable");
    const { CredentialKeys } = compiled<
      typeof import("../src/v2/modules/access/domain/credential-keys")
    >("domain/credential-keys");
    const keys = harness.app.get(CredentialKeys, { strict: false });
    const endedRow = (
      await harness.db.query<{ starts_at: string; ends_at: string }>(
        "SELECT starts_at, ends_at FROM bookings WHERE id=$1",
        [ended],
      )
    ).rows[0];
    const stale = await keys.sign(context.id, {
      iss: context.slug,
      sub: ended,
      fac: court.id,
      nbf: Math.floor(
        Temporal.Instant.from(endedRow.starts_at).epochMilliseconds / 1000,
      ),
      exp: Math.floor(
        Temporal.Instant.from(endedRow.ends_at).epochMilliseconds / 1000,
      ),
    });
    expect((await checkIn(door, stale).expect(422)).body.code).toBe(
      "credential_expired",
    );
    const cancelled = await booking(
      context,
      (await facility(context)).id,
      startedToday(),
      90,
    );
    const kept = await credential(context.citizen, cancelled);
    await harness.db.query(
      "UPDATE bookings SET status='cancelled', cancelled_at=now(), cancelled_by='municipality', cancellation_reason='Closed' WHERE id=$1",
      [cancelled],
    );
    expect((await checkIn(door, kept.token).expect(422)).body.code).toBe(
      "booking_cancelled",
    );
  });
  it("should accept scans queued offline within a day and record who checked in", async () => {
    const context = await tenant();
    const court = await facility(context);
    const door = await staff(context);
    const ongoing = await booking(context, court.id, startedToday());
    const issued = await credential(context.citizen, ongoing);
    await checkIn(
      door,
      issued.token,
      Temporal.Now.instant().subtract({ hours: 30 }).toString(),
    ).expect(400);
    const scannedAt = Temporal.Now.instant()
      .subtract({ minutes: 1 })
      .round({ smallestUnit: "millisecond" });
    const body = (
      await checkIn(door, issued.token, scannedAt.toString()).expect(200)
    ).body as { checkedInAt: string };
    expect(Temporal.Instant.from(body.checkedInAt).equals(scannedAt)).toBe(
      true,
    );
    const audit = (
      await harness.db.query<{ action: string; actor_role: string }>(
        "SELECT action, actor_role FROM audit_events WHERE tenant_id=$1 AND resource_id=$2",
        [context.id, ongoing],
      )
    ).rows;
    expect(audit).toContainEqual({
      action: "booking.checked_in",
      actor_role: "staff",
    });
  });
  it("should limit door staff to today's attendance and keep management off-limits", async () => {
    const context = await tenant();
    const court = await facility(context);
    const door = await staff(context);
    const scanned = await booking(context, court.id, startedToday());
    const absent = await booking(
      context,
      (await facility(context)).id,
      startedToday(),
      45,
    );
    const future = await post(context.citizen, "citizen/bookings", {
      id: randomUUID(),
      facilityId: court.id,
      start: start(2, 11),
    }).expect(201);
    await checkIn(
      door,
      (await credential(context.citizen, scanned)).token,
    ).expect(200);
    const day = (
      await door
        .get("/v2/manager/bookings")
        .query({ date: today() })
        .expect(200)
    ).body as {
      id: string;
      checkedInAt: string | null;
      canMarkNoShow: boolean;
      canCancel: boolean;
    }[];
    expect(day.find((item) => item.id === scanned)).toMatchObject({
      canMarkNoShow: false,
      canCancel: false,
    });
    expect(day.find((item) => item.id === scanned)?.checkedInAt).toBeTruthy();
    expect(day.find((item) => item.id === absent)).toMatchObject({
      checkedInAt: null,
      canMarkNoShow: true,
    });
    await door
      .get("/v2/manager/bookings")
      .query({ date: start(2).slice(0, 10) })
      .expect(403);
    expect(
      (
        await patch(door, `manager/bookings/${scanned}`, {
          attendance: "no_show",
        }).expect(422)
      ).body.code,
    ).toBe("checked_in");
    await patch(door, `manager/bookings/${future.body.id as string}`, {
      status: "cancelled",
      reason: "Closed",
    }).expect(403);
    expect(
      (await post(door, "manager/bookings/no-shows", {}).expect(200)).body,
    ).toEqual({ marked: 1 });
    expect(
      (
        await harness.db.query<{ id: string; status: string }>(
          "SELECT id, status FROM bookings WHERE id = ANY($1) ORDER BY id",
          [[scanned, absent]],
        )
      ).rows.map((row) => [row.id, row.status]),
    ).toEqual(
      [
        [scanned, "confirmed"],
        [absent, "no_show"],
      ].sort((a, b) => a[0].localeCompare(b[0])),
    );
    await patch(door, `manager/bookings/${absent}`, {
      attendance: "attended",
    }).expect(204);
    await door.get("/v2/manager/audit").expect(403);
    await door.get("/v2/manager/insights").expect(403);
    await door.get("/v2/manager/access").expect(403);
    await patch(door, "manager/municipality", { advanceDays: 20 }).expect(403);
    await patch(door, `manager/facilities/${court.id}`, {
      name: "Renamed",
    }).expect(403);
    await post(door, "manager/access/key-rotations", {}).expect(403);
    await door.get("/v2/citizen/bookings").expect(403);
  });
  it("should revoke every credential of the old key when the municipality rotates it", async () => {
    const context = await tenant();
    const court = await facility(context);
    const door = await staff(context);
    const ongoing = await booking(context, court.id, startedToday());
    const before = await credential(context.citizen, ongoing);
    const settings = (
      await context.manager.get("/v2/manager/access").expect(200)
    ).body as { key: { kid: string; fingerprint: string } };
    expect(settings.key.kid).toBe(before.keyId);
    expect(settings.key.fingerprint).toMatch(/^[0-9a-f]{4}(:[0-9a-f]{4}){3}$/);
    const rotated = (
      await post(context.manager, "manager/access/key-rotations", {}).expect(
        201,
      )
    ).body as { kid: string };
    expect(rotated.kid).not.toBe(before.keyId);
    expect((await checkIn(door, before.token).expect(422)).body.code).toBe(
      "invalid_credential",
    );
    const after = await credential(context.citizen, ongoing);
    expect(after.keyId).toBe(rotated.kid);
    await checkIn(door, after.token).expect(200);
    expect(
      (
        await harness.db.query(
          "SELECT 1 FROM audit_events WHERE tenant_id=$1 AND action='access.key_rotated'",
          [context.id],
        )
      ).rowCount,
    ).toBe(1);
  });
  it("should announce confirmed and cancelled reservations on the signed open webhook", async () => {
    const received: { headers: IncomingHttpHeaders; body: string }[] = [];
    const receiver = createServer((req, res) => {
      let body = "";
      req.on("data", (chunk: Buffer) => (body += chunk.toString()));
      req.on("end", () => {
        received.push({ headers: req.headers, body });
        res.writeHead(204).end();
      });
    });
    await new Promise<void>((resolve) =>
      receiver.listen(0, "127.0.0.1", resolve),
    );
    try {
      const context = await tenant();
      const court = await facility(context);
      const url = `http://127.0.0.1:${(receiver.address() as AddressInfo).port}/hooks`;
      await (
        await staff(context)
      )
        .put("/v2/manager/access/webhook")
        .set("X-Quenda-Request", "1")
        .send({ url })
        .expect(403);
      await context.manager
        .put("/v2/manager/access/webhook")
        .set("X-Quenda-Request", "1")
        .send({ url: "http://example.org/hooks" })
        .expect(400);
      const configured = (
        await context.manager
          .put("/v2/manager/access/webhook")
          .set("X-Quenda-Request", "1")
          .send({ url })
          .expect(200)
      ).body as { secret: string };
      expect(configured.secret).toMatch(/^whsec_/);
      const settings = (
        await context.manager.get("/v2/manager/access").expect(200)
      ).body as Record<string, unknown>;
      expect(settings).toMatchObject({
        webhookUrl: url,
        hasWebhookSecret: true,
      });
      expect(JSON.stringify(settings)).not.toContain(configured.secret);
      const id = randomUUID();
      await post(context.citizen, "citizen/bookings", {
        id,
        facilityId: court.id,
        start: start(3, 12),
      }).expect(201);
      expect(
        (
          await harness.db.query(
            "SELECT 1 FROM access_webhook_deliveries WHERE booking_id=$1 AND sent_at IS NULL",
            [id],
          )
        ).rowCount,
      ).toBe(1);
      const { AccessWebhookDispatcher } = compiled<
        typeof import("../src/v2/modules/access/infrastructure/webhook/access-webhook-dispatcher")
      >("infrastructure/webhook/access-webhook-dispatcher");
      const dispatcher = harness.app.get(AccessWebhookDispatcher, {
        strict: false,
      });
      await dispatcher.deliverDue();
      await patch(context.citizen, `citizen/bookings/${id}`, {
        status: "cancelled",
      }).expect(204);
      await dispatcher.deliverDue();
      const mine = received.filter((item) => item.body.includes(id));
      expect(mine.map((item) => JSON.parse(item.body).type)).toEqual([
        "access.credential.issued",
        "access.credential.revoked",
      ]);
      for (const item of mine) {
        const expected = createHmac(
          "sha256",
          Buffer.from(configured.secret.slice(6), "base64"),
        )
          .update(
            `${String(item.headers["webhook-id"])}.${String(item.headers["webhook-timestamp"])}.${item.body}`,
          )
          .digest("base64");
        expect(item.headers["webhook-signature"]).toBe(`v1,${expected}`);
      }
      const issued = JSON.parse(mine[0].body).data as {
        credential: { token: string };
      };
      expect(claims(issued.credential.token)).toMatchObject({ sub: id });
      expect(JSON.parse(mine[1].body).data.credential).toBeNull();
      expect(mine[0].body).not.toContain("citizen");
    } finally {
      receiver.close();
    }
  });
});
