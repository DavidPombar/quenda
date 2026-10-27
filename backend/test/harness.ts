// SPDX-License-Identifier: AGPL-3.0-or-later
import { randomUUID } from "node:crypto";
import { createRequire } from "node:module";
import { readFile } from "node:fs/promises";
import { createServer } from "node:net";
import { Pool } from "pg";
import request from "supertest";
import type { INestApplication } from "@nestjs/common";
import { Temporal } from "@js-temporal/polyfill";
import { openingCalendar } from "../src/database/seed";
const require = createRequire(import.meta.url);
export type Agent = ReturnType<typeof request.agent>;
export interface Harness {
  app: INestApplication;
  db: Pool;
}
export const LEGAL_VERSION = "2026-10";
const baseUrl =
  process.env.TEST_DATABASE_URL ??
  "postgres://quenda:quenda_local@127.0.0.1:55432/quenda";
let admin: Pool | undefined;
let databaseName: string | undefined;
let savedEnv: Record<string, string | undefined> = {};
export const harness = {} as Harness;
/** Reserves a free loopback port so the app's own base URL is known before it boots. */
function freePort() {
  return new Promise<number>((resolve, reject) => {
    const server = createServer();
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      server.close(() =>
        typeof address === "object" && address
          ? resolve(address.port)
          : reject(new Error("No port")),
      );
    });
  });
}
export interface SetupOptions {
  /** Extra environment for the app, given its base URL (e.g. PUBLIC_URL); restored on teardown. */
  env?: (baseUrl: string) => Record<string, string | undefined>;
}
// Each spec file boots the compiled app against its own disposable database.
// Takes no parameters so it can be passed to beforeAll directly.
export function setup() {
  return setupWith({});
}
/** Like setup(), with extra environment for the app (e.g. an OIDC provider). */
export async function setupWith(options: SetupOptions) {
  databaseName = `quenda_test_${randomUUID().replaceAll("-", "")}`;
  const testUrl = new URL(baseUrl);
  testUrl.pathname = `/${databaseName}`;
  process.env.NODE_ENV = "test";
  process.env.DEMO_MODE = "true";
  process.env.DATABASE_URL = testUrl.toString();
  admin = new Pool({ connectionString: baseUrl });
  await admin.query(`CREATE DATABASE "${databaseName}"`);
  harness.db = new Pool({ connectionString: testUrl.toString() });
  await harness.db.query(
    await readFile(
      new URL("../src/database/schema.sql", import.meta.url),
      "utf8",
    ),
  );
  const port = options.env ? await freePort() : 0;
  const extra = options.env?.(`http://127.0.0.1:${port}`) ?? {};
  savedEnv = Object.fromEntries(
    Object.keys(extra).map((key) => [key, process.env[key]]),
  );
  for (const [key, value] of Object.entries(extra))
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  const { createApp } = require("../dist/bootstrap.js") as {
    createApp: () => Promise<INestApplication>;
  };
  harness.app = await createApp();
  await harness.app.listen(port, "127.0.0.1");
}
export async function teardown() {
  if (harness.app) await harness.app.close();
  for (const [key, value] of Object.entries(savedEnv))
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  savedEnv = {};
  if (harness.db) await harness.db.end();
  if (admin) {
    await admin.query(`DROP DATABASE IF EXISTS "${databaseName}"`);
    await admin.end();
  }
}
export function post(agent: Agent, path: string, body: unknown) {
  return agent.post(`/v2/${path}`).set("X-Quenda-Request", "1").send(body);
}
export function patch(agent: Agent, path: string, body: unknown) {
  return agent.patch(`/v2/${path}`).set("X-Quenda-Request", "1").send(body);
}
export function del(agent: Agent, path: string) {
  return agent.delete(`/v2/${path}`).set("X-Quenda-Request", "1");
}
export function start(days = 2, hour = 10) {
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
// Municipality installation and demo accounts are bootstrap configuration, not API-owned resources.
export async function tenant() {
  const id = randomUUID();
  const slug = `test-${id}`;
  await harness.db.query(
    "INSERT INTO municipalities VALUES ($1,$2,$3,$4,$5,14,2,5,$6,$7)",
    [
      id,
      slug,
      "Test municipality",
      "Europe/Madrid",
      "gl",
      "test@example.invalid",
      "Synthetic test data",
    ],
  );
  const users: Record<"citizen" | "manager", string> = {
    citizen: randomUUID(),
    manager: randomUUID(),
  };
  for (const role of ["citizen", "manager"] as const)
    await harness.db.query("INSERT INTO users VALUES ($1,$2,$3,$4)", [
      users[role],
      id,
      role,
      role,
    ]);
  const citizen = request.agent(harness.app.getHttpServer());
  const manager = request.agent(harness.app.getHttpServer());
  await post(citizen, "public/sessions", {
    slug,
    role: "citizen",
    legalVersion: LEGAL_VERSION,
  }).expect(201);
  await post(manager, "public/sessions", { slug, role: "manager" }).expect(201);
  return { id, slug, users, citizen, manager };
}
export type Tenant = Awaited<ReturnType<typeof tenant>>;
export async function facility(context: Tenant, calendar?: string) {
  const id = randomUUID();
  const body = {
    id,
    name: `Court ${id}`,
    sport: "padel",
    address: "Test street",
    description: "Test facility",
    accessible: true,
    status: "active",
    slotMinutes: 60,
    priceCents: 0,
    openingCalendar: calendar ?? openingCalendar(id),
    rules: "Sports shoes required",
  };
  await post(context.manager, "manager/facilities", body).expect(201);
  return body;
}
export async function availability(
  context: Tenant,
  id: string,
  instant: string,
) {
  const date = Temporal.Instant.from(instant)
    .toZonedDateTimeISO("Europe/Madrid")
    .toPlainDate()
    .toString();
  return request(harness.app.getHttpServer())
    .get(`/v2/public/availability/${id}`)
    .query({ slug: context.slug, date })
    .expect(200);
}
