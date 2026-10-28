// SPDX-License-Identifier: AGPL-3.0-or-later
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { randomUUID } from "node:crypto";
import { createRequire } from "node:module";
import { Pool } from "pg";
import request from "supertest";
import type { INestApplication } from "@nestjs/common";
import { Temporal } from "@js-temporal/polyfill";
import { openingCalendar } from "../src/database/seed";
import { migrate } from "../src/database/migrate";
import { importMunicipality } from "../src/database/import";
const require = createRequire(import.meta.url);
const baseUrl =
  process.env.TEST_DATABASE_URL ??
  "postgres://quenda:quenda_local@127.0.0.1:55432/quenda";
function databaseUrl(name: string) {
  const url = new URL(baseUrl);
  url.pathname = `/${name}`;
  return url.toString();
}
const names = ["source", "target"].map(
  (kind) => `quenda_${kind}_${randomUUID().replaceAll("-", "")}`,
);
const [sourceUrl, targetUrl] = names.map(databaseUrl);
let admin: Pool;
let sourceDb: Pool;
let targetDb: Pool;
let source: INestApplication;
let target: INestApplication;
type Agent = ReturnType<typeof request.agent>;
function post(agent: Agent, path: string, body: unknown) {
  return agent.post(`/v2/${path}`).set("X-Quenda-Request", "1").send(body);
}
function patch(agent: Agent, path: string, body: unknown) {
  return agent.patch(`/v2/${path}`).set("X-Quenda-Request", "1").send(body);
}
function start(days: number, hour: number) {
  return Temporal.Now.zonedDateTimeISO("Europe/Madrid")
    .add({ days })
    .toPlainDate()
    .toZonedDateTime({
      timeZone: "Europe/Madrid",
      plainTime: `${String(hour).padStart(2, "0")}:00`,
    })
    .toInstant()
    .toString();
}
async function boot(url: string) {
  process.env.DATABASE_URL = url;
  const { createApp } = require("../dist/bootstrap.js") as {
    createApp: () => Promise<INestApplication>;
  };
  const app = await createApp();
  await app.listen(0, "127.0.0.1");
  return app;
}
async function signIn(app: INestApplication, slug: string, role: string) {
  const agent = request.agent(app.getHttpServer());
  await post(agent, "public/sessions", {
    slug,
    role,
    legalVersion: "2026-10",
  }).expect(201);
  return agent;
}
beforeAll(async () => {
  process.env.NODE_ENV = "test";
  process.env.DEMO_MODE = "true";
  admin = new Pool({ connectionString: baseUrl });
  for (const name of names) await admin.query(`CREATE DATABASE "${name}"`);
  await migrate(sourceUrl, () => undefined);
  sourceDb = new Pool({ connectionString: sourceUrl });
  targetDb = new Pool({ connectionString: targetUrl });
  source = await boot(sourceUrl);
});
afterAll(async () => {
  for (const app of [source, target]) if (app) await app.close();
  if (sourceDb) await sourceDb.end();
  if (targetDb) await targetDb.end();
  if (admin) {
    for (const name of names)
      await admin.query(`DROP DATABASE IF EXISTS "${name}"`);
    await admin.end();
  }
});
describe("Municipality data portability", () => {
  it("should rebuild the same catalog, availability and history in an empty instance when an export is imported", async () => {
    const tenantId = randomUUID();
    const slug = `portable-${tenantId}`;
    const db = sourceDb;
    await db.query(
      "INSERT INTO municipalities VALUES ($1,$2,'Portable','Europe/Madrid','gl',14,2,5,'test@example.invalid','Synthetic')",
      [tenantId, slug],
    );
    for (const role of ["citizen", "manager"])
      await db.query("INSERT INTO users VALUES ($1,$2,$3,$4)", [
        randomUUID(),
        tenantId,
        role,
        role,
      ]);
    const citizen = await signIn(source, slug, "citizen");
    const manager = await signIn(source, slug, "manager");
    const court = randomUUID();
    await post(manager, "manager/facilities", {
      id: court,
      name: "Portable court",
      sport: "padel",
      address: "Test street",
      description: "Test facility",
      accessible: true,
      status: "active",
      slotMinutes: 60,
      priceCents: 400,
      openingCalendar: openingCalendar(court),
      rules: "Sports shoes required",
    }).expect(201);
    await db.query(
      "UPDATE municipalities SET enabled_categories=ARRAY['resident','family'] WHERE id=$1",
      [tenantId],
    );
    await db.query(
      "INSERT INTO facility_prices VALUES ($1,$2,'resident',150)",
      [tenantId, court],
    );
    await db.query(
      "INSERT INTO user_categories SELECT tenant_id,id,'resident','verified',NULL,'2026-10-20T10:00:00Z' FROM users WHERE tenant_id=$1 AND role='citizen'",
      [tenantId],
    );
    await db.query(
      "UPDATE users SET prefers_family_tariff=true WHERE tenant_id=$1 AND role='citizen'",
      [tenantId],
    );
    const kept = randomUUID();
    const cancelled = randomUUID();
    await post(citizen, "citizen/bookings", {
      id: kept,
      facilityId: court,
      start: start(2, 10),
    }).expect(201);
    await post(citizen, "citizen/bookings", {
      id: cancelled,
      facilityId: court,
      start: start(2, 12),
    }).expect(201);
    await patch(citizen, `citizen/bookings/${cancelled}`, {
      status: "cancelled",
    }).expect(204);

    await post(citizen, `citizen/bookings/${kept}/access-pass`, {}).expect(200);
    await manager
      .put("/v2/manager/access-webhook")
      .set("X-Quenda-Request", "1")
      .send({ url: "https://access.example.invalid/hook" })
      .expect(200);
    await db.query(
      "INSERT INTO check_ins (id,tenant_id,booking_id,booking_sequence,actor_id,method,checked_in_at,recorded_at) SELECT $1,$2,$3,0,id,'manual','2026-10-20T10:00:00Z','2026-10-20T10:00:00Z' FROM users WHERE tenant_id=$2 AND role='manager'",
      [randomUUID(), tenantId, kept],
    );
    // Data introduced on main must survive transfer as well as the original V0 catalog.
    await db.query(
      "UPDATE municipalities SET retention_months=18,primary_color='#123456',no_show_limit=2,reminder_hours=12,mail_sender_name='Sports desk',mail_reply_to='sports@example.invalid',accessibility_unit='Accessibility office',accessibility_email='accessibility@example.invalid',accessibility_phone='+34986000001',accessibility_reviewed_on='2026-10-01',accessibility_method='external',accessibility_exceptions_gl='Revisión pendente',accessibility_exceptions_es='Revisión pendiente' WHERE id=$1",
      [tenantId],
    );
    await db.query(
      "UPDATE users SET email='citizen@example.invalid',locale='es' WHERE tenant_id=$1 AND role='citizen'",
      [tenantId],
    );
    await db.query(
      "INSERT INTO legal_texts VALUES ($1,'2026-10','Aviso galego','Aviso español','2026-10-20T10:00:00Z')",
      [tenantId],
    );
    await db.query(
      "INSERT INTO municipality_logos VALUES ($1,'image/png',$2,'logo-hash','2026-10-20T10:00:00Z')",
      [
        tenantId,
        Buffer.from(
          "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aI1sAAAAASUVORK5CYII=",
          "base64",
        ),
      ],
    );
    await db.query(
      "INSERT INTO notification_preferences SELECT tenant_id,id,'reminder','email',false,'2026-10-20T10:00:00Z' FROM users WHERE tenant_id=$1 AND role='citizen'",
      [tenantId],
    );
    await db.query(
      "INSERT INTO booking_blocks SELECT $1,tenant_id,id,$3,'2001-01-01T10:00:00Z','2001-01-08T10:00:00Z',NULL FROM users WHERE tenant_id=$2 AND role='citizen'",
      [randomUUID(), tenantId, cancelled],
    );
    // A no-show keeps the unit it held, like one marked through the API.
    await db.query(
      `WITH booking AS (
        INSERT INTO bookings (id,tenant_id,user_id,facility_id,resource_id,starts_at,ends_at,status,created_at,sequence) VALUES ($1,$2,NULL,$3,$3,'2001-01-01T10:00:00Z','2001-01-01T11:00:00Z','no_show','2001-01-01T09:00:00Z',4) RETURNING id
      )
      INSERT INTO booking_units SELECT $2,id,$3,'2001-01-01T10:00:00Z','2001-01-01T11:00:00Z' FROM booking`,
      [randomUUID(), tenantId, court],
    );
    // A second court, out of service, travels with the catalog.
    await db.query(
      "INSERT INTO resources (id,tenant_id,facility_id,name,position,active) VALUES ($1,$2,$3,'Pista 2',1,false)",
      [randomUUID(), tenantId, court],
    );
    await db.query(
      "INSERT INTO users (id,tenant_id,display_name,role,deleted_at) VALUES ($1,$2,'Conta eliminada','citizen','2001-01-01T09:00:00Z')",
      [randomUUID(), tenantId],
    );
    await db.query(
      "INSERT INTO audit_events (id,tenant_id,actor_id,action,resource_id,occurred_at,actor_role,details) VALUES ($1,$2,NULL,'retention.applied',$2,'2001-01-01T09:00:00Z','system','{\"detached\":1}')",
      [randomUUID(), tenantId],
    );
    await db.query(
      "UPDATE outbox SET sent_at=created_at,attempts=1 WHERE tenant_id=$1 AND booking_id=$2",
      [tenantId, kept],
    );
    const subscription = await post(
      citizen,
      "citizen/calendar-feed",
      {},
    ).expect(201);
    await citizen.get("/v2/manager/export").expect(403);
    const exported = await manager.get("/v2/manager/export").expect(200);
    expect(exported.headers["content-disposition"]).toMatch(
      new RegExp(
        `attachment; filename="quenda-${slug}-\\d{4}-\\d{2}-\\d{2}\\.json"`,
      ),
    );
    const pack = exported.body as Record<string, unknown> & {
      users: Record<string, unknown>[];
      facilities: { openingCalendar: string }[];
    };
    expect(pack).toMatchObject({
      format: "quenda-municipality-export",
      version: 2,
    });
    expect(Object.keys(pack.users[0]).sort()).toEqual([
      "assurance",
      "deletedAt",
      "displayName",
      "email",
      "id",
      "locale",
      "nifCiphertext",
      "nifDigest",
      "prefersFamilyTariff",
      "role",
    ]);
    expect(pack).toMatchObject({
      municipality: { enabledCategories: ["resident", "family"] },
      facilityPrices: [
        { facilityId: court, category: "resident", priceCents: 150 },
      ],
      userCategories: [
        {
          category: "resident",
          status: "verified",
          requestedAt: null,
          decidedAt: "2026-10-20T10:00:00Z",
        },
      ],
      bookings: expect.arrayContaining([
        expect.objectContaining({
          id: kept,
          tariffCategory: "resident",
          priceCents: 150,
        }),
      ]),
    });
    expect(pack.facilities[0].openingCalendar).toBe(openingCalendar(court));
    expect(JSON.stringify(pack)).not.toMatch(/token|session/i);

    await importMunicipality(pack, { url: targetUrl });
    await expect(importMunicipality(pack, { url: targetUrl })).rejects.toThrow(
      /already exists/,
    );
    // Compare persisted records before sign-in creates new consent/audit records.
    for (const table of [
      "municipalities",
      "facilities",
      "access_keys",
      "check_ins",
      "facility_prices",
      "facility_status_periods",
      "user_categories",
      "resources",
      "users",
      "identities",
      "bookings",
      "booking_units",
      "notifications",
      "audit_events",
      "consents",
      "legal_texts",
      "municipality_logos",
      "booking_blocks",
      "notification_preferences",
      "outbox",
    ]) {
      const scope = table === "municipalities" ? "id" : "tenant_id";
      const filter =
        table === "audit_events"
          ? " AND action <> 'municipality.exported'"
          : "";
      const query = `SELECT to_jsonb(r) AS record FROM ${table} r WHERE ${scope}=$1${filter} ORDER BY to_jsonb(r)::text`;
      expect((await targetDb.query(query, [tenantId])).rows, table).toEqual(
        (await sourceDb.query(query, [tenantId])).rows,
      );
    }
    expect(
      (await targetDb.query("SELECT count(*)::int AS count FROM sessions"))
        .rows[0].count,
    ).toBe(0);
    expect(
      (
        await targetDb.query(
          "SELECT count(*)::int AS count FROM calendar_feeds",
        )
      ).rows[0].count,
    ).toBe(0);
    target = await boot(targetUrl);
    await request(target.getHttpServer())
      .get(subscription.body.path as string)
      .expect(404);
    const date = Temporal.Instant.from(start(2, 10))
      .toZonedDateTimeISO("Europe/Madrid")
      .toPlainDate()
      .toString();
    for (const path of [
      `/v2/public/facilities?slug=${slug}`,
      `/v2/public/availability/${court}?slug=${slug}&date=${date}`,
    ]) {
      const before = await request(source.getHttpServer())
        .get(path)
        .expect(200);
      const after = await request(target.getHttpServer()).get(path).expect(200);
      expect(after.body).toEqual(before.body);
    }
    const movedCitizen = await signIn(target, slug, "citizen");
    for (const path of ["/v2/citizen/bookings", "/v2/citizen/notifications"])
      expect((await movedCitizen.get(path).expect(200)).body).toEqual(
        (await citizen.get(path).expect(200)).body,
      );
    const movedManager = await signIn(target, slug, "manager");
    const reexported = await movedManager.get("/v2/manager/export").expect(200);
    for (const key of [
      "municipality",
      "facilities",
      "accessKeys",
      "checkIns",
      "facilityPrices",
      "facilityStatusPeriods",
      "userCategories",
      "resources",
      "users",
      "identities",
      "bookings",
      "notifications",
      "legalTexts",
      "logos",
      "bookingBlocks",
      "notificationPreferences",
      "messages",
    ]) {
      expect(reexported.body[key], key).toEqual(pack[key]);
    }
    const audited = await manager.get("/v2/manager/export").expect(200);
    expect(
      audited.body.auditEvents.map((event: { action: string }) => event.action),
    ).toContain("municipality.exported");
  });
  it("should import V0 packages with current defaults and refuse unsupported versions", async () => {
    const id = randomUUID();
    const [legacyCourt, legacyUser, legacyBooking] = [
      randomUUID(),
      randomUUID(),
      randomUUID(),
    ];
    const pack = {
      format: "quenda-municipality-export",
      version: 1,
      exportedAt: "2026-10-20T10:00:00Z",
      municipality: {
        id,
        slug: `legacy-${id}`,
        name: "Legacy council",
        timezone: "Europe/Madrid",
        locale: "gl",
        advanceDays: 14,
        cancellationHours: 2,
        maxActiveBookings: 5,
        contact: "legacy@example.invalid",
        legalText: "Legacy notice",
      },
      facilities: [
        {
          id: legacyCourt,
          name: "Legacy court",
          sport: "padel",
          address: "Old street",
          description: "Before courts",
          accessible: true,
          status: "active",
          slotMinutes: 60,
          priceCents: 0,
          openingCalendar: openingCalendar(legacyCourt),
          rules: "",
        },
      ],
      users: [{ id: legacyUser, displayName: "Legacy", role: "citizen" }],
      bookings: [
        {
          id: legacyBooking,
          userId: legacyUser,
          facilityId: legacyCourt,
          start: "2026-11-02T10:00:00Z",
          end: "2026-11-02T11:00:00Z",
          status: "confirmed",
          createdAt: "2026-10-20T09:00:00Z",
          cancelledAt: null,
        },
      ],
      notifications: [],
      auditEvents: [],
    };
    await importMunicipality(pack, { url: targetUrl });
    expect(
      (
        await targetDb.query(
          "SELECT retention_months,reminder_hours FROM municipalities WHERE id=$1",
          [id],
        )
      ).rows,
    ).toEqual([{ retention_months: 24, reminder_hours: 24 }]);
    // Packages from before courts get the default court and keep their slots occupied.
    expect(
      (
        await targetDb.query(
          "SELECT r.id, b.resource_id, u.unit_id FROM resources r JOIN bookings b ON b.resource_id=r.id JOIN booking_units u ON u.booking_id=b.id WHERE r.tenant_id=$1",
          [id],
        )
      ).rows,
    ).toEqual([
      { id: legacyCourt, resource_id: legacyCourt, unit_id: legacyCourt },
    ]);
    expect(
      (
        await targetDb.query(
          "SELECT text_gl,text_es FROM legal_texts WHERE tenant_id=$1",
          [id],
        )
      ).rows,
    ).toEqual([{ text_gl: "Legacy notice", text_es: "Legacy notice" }]);
    await expect(
      importMunicipality({ ...pack, version: 999 }, { url: targetUrl }),
    ).rejects.toThrow(/Unsupported package version/);
    const failedId = randomUUID();
    await expect(
      importMunicipality(
        {
          ...pack,
          municipality: {
            ...pack.municipality,
            id: failedId,
            slug: `invalid-${failedId}`,
          },
          users: [
            { id: randomUUID(), displayName: "Invalid role", role: "invalid" },
          ],
        },
        { url: targetUrl },
      ),
    ).rejects.toThrow();
    expect(
      (
        await targetDb.query("SELECT id FROM municipalities WHERE id=$1", [
          failedId,
        ])
      ).rows,
    ).toEqual([]);
  });
});
