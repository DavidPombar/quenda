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
  await post(agent, "public/sessions", { slug, role }).expect(201);
  return agent;
}
beforeAll(async () => {
  process.env.NODE_ENV = "test";
  process.env.DEMO_MODE = "true";
  admin = new Pool({ connectionString: baseUrl });
  for (const name of names) await admin.query(`CREATE DATABASE "${name}"`);
  await migrate(sourceUrl, () => undefined);
  source = await boot(sourceUrl);
});
afterAll(async () => {
  for (const app of [source, target]) if (app) await app.close();
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
    const db = new Pool({ connectionString: sourceUrl });
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
    await db.end();
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
      priceCents: 0,
      openingCalendar: openingCalendar(court),
      rules: "Sports shoes required",
    }).expect(201);
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
      version: 1,
    });
    expect(Object.keys(pack.users[0]).sort()).toEqual([
      "displayName",
      "id",
      "role",
    ]);
    expect(pack.facilities[0].openingCalendar).toBe(openingCalendar(court));
    expect(JSON.stringify(pack)).not.toMatch(/token|session/i);

    await importMunicipality(pack, { url: targetUrl });
    await expect(importMunicipality(pack, { url: targetUrl })).rejects.toThrow(
      /already exists/,
    );
    target = await boot(targetUrl);
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
    expect({ ...reexported.body, exportedAt: null }).toEqual({
      ...pack,
      exportedAt: null,
    });
    const audited = await manager.get("/v2/manager/export").expect(200);
    expect(
      audited.body.auditEvents.map((event: { action: string }) => event.action),
    ).toContain("municipality.exported");
  });
});
