// SPDX-License-Identifier: AGPL-3.0-or-later
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { randomUUID } from "node:crypto";
import request from "supertest";
import { openingCalendar } from "../src/database/seed";
import {
  facility,
  harness,
  post,
  setup,
  teardown,
  tenant,
  type Agent,
} from "./harness";
beforeAll(setup);
afterAll(teardown);
const LEGAL = {
  gl: "Aviso de privacidade do novo concello para as reservas.",
  es: "Aviso de privacidad del nuevo ayuntamiento para las reservas.",
};
/** Operators are deployment bootstrap data, like municipalities in the harness. */
async function operator() {
  await harness.db.query(
    "INSERT INTO operators (id,display_name) VALUES ($1,$2) ON CONFLICT DO NOTHING",
    ["40000000-0000-4000-8000-000000000001", "Deputación"],
  );
  const agent = request.agent(harness.app.getHttpServer());
  await post(agent, "public/operator-sessions", {}).expect(201);
  return agent;
}
function municipality(overrides: Record<string, unknown> = {}) {
  const id = randomUUID();
  return {
    id,
    slug: `riotorto-${id.slice(0, 8)}`,
    name: "Concello de Riotorto",
    timezone: "Europe/Madrid",
    locale: "gl",
    contact: "deportes@riotorto.example",
    legalTexts: LEGAL,
    ...overrides,
  };
}
function create(agent: Agent, body: Record<string, unknown>) {
  return post(agent, "operator/municipalities", body);
}
describe("Supramunicipal operator through HTTP and PostgreSQL", () => {
  it("should create a municipality and its manager, who can then run it, and list it in the shared catalogue", async () => {
    const deputacion = await operator();
    const body = municipality();
    const created = await create(deputacion, body).expect(201);
    expect(created.body).toMatchObject({
      id: body.id,
      slug: body.slug,
      locale: "gl",
      advanceDays: 14,
      legalTexts: LEGAL,
      legalVersion: expect.stringMatching(/^\d{4}-\d{2}-\d{2}\.1$/),
    });
    await create(deputacion, body).expect(201);
    const managerId = randomUUID();
    await post(deputacion, `operator/municipalities/${body.id}/managers`, {
      id: managerId,
      displayName: "Antía Souto",
      email: "Antia.Souto@riotorto.example",
    })
      .expect(201)
      .expect(({ body: manager }) =>
        expect(manager).toEqual({
          id: managerId,
          municipalityId: body.id,
          displayName: "Antía Souto",
          email: "antia.souto@riotorto.example",
        }),
      );
    const manager = request.agent(harness.app.getHttpServer());
    await post(manager, "public/sessions", {
      slug: body.slug,
      role: "manager",
    }).expect(201);
    const pool = randomUUID();
    await post(manager, "manager/facilities", {
      id: pool,
      name: "Piscina de Riotorto",
      sport: "swimming",
      address: "Rúa do Río, 1",
      description: "Piscina cuberta.",
      accessible: true,
      status: "active",
      slotMinutes: 60,
      priceCents: 0,
      openingCalendar: openingCalendar(pool),
      rules: "Gorro obrigatorio.",
    }).expect(201);
    const listed = await deputacion
      .get("/v2/operator/municipalities")
      .expect(200);
    expect(
      listed.body.find(
        (item: { settings: { id: string } }) => item.settings.id === body.id,
      ),
    ).toMatchObject({
      facilities: 1,
      activeFacilities: 1,
      managers: [{ id: managerId, displayName: "Antía Souto" }],
    });
    const catalogue = await request(harness.app.getHttpServer())
      .get("/v2/public/catalog")
      .query({ municipality: body.slug })
      .expect(200);
    expect(catalogue.body).toEqual([
      expect.objectContaining({
        id: pool,
        name: "Piscina de Riotorto",
        municipality: { slug: body.slug, name: "Concello de Riotorto" },
      }),
    ]);
    expect(catalogue.body[0]).not.toHaveProperty("openingCalendar");
  });
  it("should filter the shared catalogue by municipality, sport, access and text", async () => {
    const a = await tenant();
    const b = await tenant();
    const court = await facility(a);
    await facility(b);
    const all = await request(harness.app.getHttpServer())
      .get("/v2/public/catalog")
      .query({ municipality: `${a.slug},${b.slug}` })
      .expect(200);
    expect(
      all.body
        .map(
          (item: { municipality: { slug: string } }) => item.municipality.slug,
        )
        .sort(),
    ).toEqual([a.slug, b.slug].sort());
    const filtered = await request(harness.app.getHttpServer())
      .get("/v2/public/catalog")
      .query({
        municipality: `${a.slug},${b.slug}`,
        sport: "padel",
        accessible: "true",
        q: court.name.slice(0, 12),
      })
      .expect(200);
    expect(filtered.body.map((item: { id: string }) => item.id)).toContain(
      court.id,
    );
    await request(harness.app.getHttpServer())
      .get("/v2/public/catalog")
      .query({ municipality: `${a.slug},${b.slug}`, sport: "tennis" })
      .expect(200)
      .expect(({ body }) => expect(body).toEqual([]));
    await request(harness.app.getHttpServer())
      .get("/v2/public/catalog")
      .query({ municipality: "Bad Slug" })
      .expect(400);
  });
  it("should reject duplicate slugs, invalid zones and reused ids", async () => {
    const deputacion = await operator();
    const first = municipality();
    await create(deputacion, first).expect(201);
    expect(
      (await create(deputacion, municipality({ slug: first.slug })).expect(409))
        .body.code,
    ).toBe("slug_taken");
    await create(deputacion, municipality({ timezone: "Mars/Olympus" })).expect(
      400,
    );
    await create(deputacion, municipality({ slug: "operador" })).expect(409);
    await create(deputacion, { ...first, name: "Outro nome" }).expect(409);
    await post(deputacion, `operator/municipalities/${randomUUID()}/managers`, {
      id: randomUUID(),
      displayName: "Ninguén",
      email: "ninguen@example.org",
    }).expect(404);
  });
  it("should keep tenant sessions out of the operator area and operators out of tenant data", async () => {
    const context = await tenant();
    await context.manager.get("/v2/operator/municipalities").expect(401);
    await context.citizen.get("/v2/operator/insights").expect(401);
    await create(context.manager, municipality()).expect(401);
    const deputacion = await operator();
    await deputacion.get("/v2/manager/insights").expect(401);
    await deputacion.get("/v2/manager/audit").expect(401);
    await deputacion.get("/v2/citizen/bookings").expect(401);
  });
  it("should report only aggregated figures per municipality", async () => {
    const context = await tenant();
    await facility(context);
    const deputacion = await operator();
    const result = await deputacion
      .get("/v2/operator/insights")
      .query({ from: "2026-10-05", to: "2026-10-11" })
      .expect(200);
    const row = result.body.municipalities.find(
      (item: { id: string }) => item.id === context.id,
    );
    expect(Object.keys(row).sort()).toEqual(
      [
        "bookedMinutes",
        "cancelled",
        "confirmed",
        "facilities",
        "from",
        "id",
        "name",
        "noShows",
        "occupancy",
        "openMinutes",
        "slug",
        "to",
        "total",
      ].sort(),
    );
    expect(result.body.facilities).toBeGreaterThanOrEqual(1);
    await deputacion
      .get("/v2/operator/insights")
      .query({ from: "2025-01-01", to: "2026-05-01" })
      .expect(400);
  });
  it("should audit operator actions for the deployment and for the affected municipality", async () => {
    const deputacion = await operator();
    const body = municipality();
    await create(deputacion, body).expect(201);
    const trail = await harness.db.query(
      "SELECT action, tenant_id FROM operator_audit_events WHERE resource_id=$1",
      [body.id],
    );
    expect(trail.rows).toEqual([
      { action: "municipality.created", tenant_id: body.id },
    ]);
    const local = await harness.db.query(
      "SELECT actor_role, details->'operator'->>'name' AS operator FROM audit_events WHERE tenant_id=$1 AND action='municipality.created'",
      [body.id],
    );
    expect(local.rows).toEqual([
      { actor_role: "system", operator: "Deputación" },
    ]);
  });
  it("should sign operators in and out with their own session", async () => {
    const deputacion = await operator();
    expect(
      (await deputacion.get("/v2/public/operator-session").expect(200)).body
        .session,
    ).toMatchObject({ displayName: "Deputación" });
    await deputacion
      .delete("/v2/public/operator-session")
      .set("X-Quenda-Request", "1")
      .expect(204);
    await deputacion.get("/v2/operator/municipalities").expect(401);
  });
});
