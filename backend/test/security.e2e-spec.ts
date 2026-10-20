// SPDX-License-Identifier: AGPL-3.0-or-later
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { randomUUID } from "node:crypto";
import { createRequire } from "node:module";
import { Pool } from "pg";
import request from "supertest";
import type { INestApplication } from "@nestjs/common";
import { migrate } from "../src/database/migrate";
const require = createRequire(import.meta.url);
const databaseName = `quenda_security_${randomUUID().replaceAll("-", "")}`;
const baseUrl =
  process.env.TEST_DATABASE_URL ??
  "postgres://quenda:quenda_local@127.0.0.1:55432/quenda";
const testUrl = new URL(baseUrl);
testUrl.pathname = `/${databaseName}`;
const sessionLimit = 3;
let app: INestApplication;
let db: Pool;
let admin: Pool;
const slug = `security-${randomUUID()}`;
const tenantId = randomUUID();
const userId = randomUUID();
function signIn() {
  return request(app.getHttpServer())
    .post("/v2/public/sessions")
    .set("X-Quenda-Request", "1")
    .send({ slug, role: "citizen" });
}
beforeAll(async () => {
  process.env.NODE_ENV = "test";
  process.env.DEMO_MODE = "true";
  process.env.COOKIE_SECURE = "true";
  process.env.SESSION_RATE_LIMIT_PER_MINUTE = String(sessionLimit);
  process.env.DATABASE_URL = testUrl.toString();
  admin = new Pool({ connectionString: baseUrl });
  await admin.query(`CREATE DATABASE "${databaseName}"`);
  await migrate(testUrl.toString(), () => undefined);
  db = new Pool({ connectionString: testUrl.toString() });
  await db.query(
    "INSERT INTO municipalities VALUES ($1,$2,'Security','Europe/Madrid','gl',14,2,5,'test@example.invalid','Synthetic')",
    [tenantId, slug],
  );
  await db.query("INSERT INTO users VALUES ($1,$2,'citizen','citizen')", [
    userId,
    tenantId,
  ]);
  // Purged by the startup run of the session purge scheduler.
  await db.query(
    "INSERT INTO sessions VALUES ('expired-session',$1,$2,'2000-01-01T00:00:00Z')",
    [tenantId, userId],
  );
  const { createApp } = require("../dist/bootstrap.js") as {
    createApp: () => Promise<INestApplication>;
  };
  app = await createApp();
  await app.listen(0, "127.0.0.1");
});
afterAll(async () => {
  if (app) await app.close();
  if (db) await db.end();
  if (admin) {
    await admin.query(`DROP DATABASE IF EXISTS "${databaseName}"`);
    await admin.end();
  }
});
describe("Deployment hardening", () => {
  it("should issue Secure, HttpOnly and SameSite=Strict session cookies", async () => {
    const response = await signIn().expect(201);
    const cookie = String(response.headers["set-cookie"]);
    expect(cookie).toMatch(/quenda_session=/);
    expect(cookie).toMatch(/; Secure/);
    expect(cookie).toMatch(/; HttpOnly/);
    expect(cookie).toMatch(/; SameSite=Strict/);
  });
  it("should rate limit sign-in attempts with a localized problem", async () => {
    for (let attempt = 1; attempt < sessionLimit; attempt++)
      await signIn().expect(201);
    const limited = await signIn().set("Accept-Language", "es").expect(429);
    expect(limited.headers["content-type"]).toContain(
      "application/problem+json",
    );
    expect(limited.headers["retry-after"]).toBeDefined();
    expect(limited.body).toMatchObject({
      status: 429,
      code: "rate_limited",
      detail: expect.stringContaining("Demasiadas solicitudes"),
    });
    // Reads keep their own, more generous, per-client budget.
    await request(app.getHttpServer())
      .get("/v2/public/municipalities")
      .expect(200);
  });
  it("should purge expired sessions", async () => {
    await expect
      .poll(async () => {
        const { rowCount } = await db.query(
          "SELECT 1 FROM sessions WHERE token_hash='expired-session'",
        );
        return rowCount;
      })
      .toBe(0);
    const { rows } = await db.query<{ count: string }>(
      "SELECT count(*) FROM sessions WHERE expires_at > now()",
    );
    expect(Number(rows[0].count)).toBeGreaterThan(0);
  });
});
