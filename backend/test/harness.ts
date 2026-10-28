// SPDX-License-Identifier: AGPL-3.0-or-later
import { randomUUID } from "node:crypto";
import { createRequire } from "node:module";
import { migrate } from "../src/database/migrate";
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
export const harness = {} as Harness;
// Each spec file boots the compiled app against its own disposable database.
export async function setup() {
  databaseName = `quenda_test_${randomUUID().replaceAll("-", "")}`;
  const testUrl = new URL(baseUrl);
  testUrl.pathname = `/${databaseName}`;
  process.env.NODE_ENV = "test";
  process.env.SESSION_RATE_LIMIT_PER_MINUTE = "1000";
  process.env.DEMO_MODE = "true";
  process.env.DATABASE_URL = testUrl.toString();
  admin = new Pool({ connectionString: baseUrl });
  await admin.query(`CREATE DATABASE "${databaseName}"`);
  harness.db = new Pool({ connectionString: testUrl.toString() });
  await migrate(testUrl.toString(), () => undefined);
  const { createApp } = require("../dist/bootstrap.js") as {
    createApp: () => Promise<INestApplication>;
  };
  harness.app = await createApp();
  await harness.app.listen(0, "127.0.0.1");
}
export async function teardown() {
  if (harness.app) await harness.app.close();
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
export interface ResourceSlots {
  id: string;
  name: string;
  parentId: string | null;
  active: boolean;
  slots: { start: string; end: string; status: string }[];
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
/** Status of the slot starting at `instant` for a resource (default: the facility's first). */
export async function slotStatus(
  context: Tenant,
  facilityId: string,
  instant: string,
  resourceId = facilityId,
) {
  const resources = (await availability(context, facilityId, instant)).body
    .resources as ResourceSlots[];
  return resources
    .find((resource) => resource.id === resourceId)
    ?.slots.find((slot) => slot.start === instant)?.status;
}
// Extra courts are inserted directly until the manager API for resources exists.
export async function addResources(
  context: Tenant,
  facilityId: string,
  items: { name: string; parentId?: string; active?: boolean }[],
) {
  const ids: string[] = [];
  for (const item of items) {
    const id = randomUUID();
    await harness.db.query(
      `INSERT INTO resources (id,tenant_id,facility_id,name,position,parent_id,active)
      SELECT $1,$2,$3,$4,coalesce(max(position),-1)+1,$5,$6 FROM resources WHERE tenant_id=$2 AND facility_id=$3`,
      [
        id,
        context.id,
        facilityId,
        item.name,
        item.parentId ?? null,
        item.active ?? true,
      ],
    );
    ids.push(id);
  }
  return ids;
}
/** An empty disposable database on the test server, for schema migration checks. */
export async function emptyDatabase() {
  const name = `quenda_test_${randomUUID().replaceAll("-", "")}`;
  const url = new URL(baseUrl);
  url.pathname = `/${name}`;
  const server = new Pool({ connectionString: baseUrl });
  await server.query(`CREATE DATABASE "${name}"`);
  const db = new Pool({ connectionString: url.toString() });
  return {
    db,
    url: url.toString(),
    async drop() {
      await db.end();
      await server.query(`DROP DATABASE IF EXISTS "${name}"`);
      await server.end();
    },
  };
}
