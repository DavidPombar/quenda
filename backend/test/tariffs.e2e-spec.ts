// SPDX-License-Identifier: AGPL-3.0-or-later
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createHash, randomBytes, randomUUID } from "node:crypto";
import request from "supertest";
import {
  del,
  facility,
  harness,
  patch,
  post,
  setup,
  start,
  teardown,
  tenant,
  type Agent,
  type Tenant,
} from "./harness";
beforeAll(setup);
afterAll(teardown);
function put(agent: Agent, path: string, body: unknown) {
  return agent.put(`/v2/${path}`).set("X-Quenda-Request", "1").send(body);
}
/** A second citizen in the same municipality, signed in through a stored session. */
async function citizen(context: Tenant, displayName: string) {
  const id = randomUUID();
  const token = randomBytes(32).toString("hex");
  await harness.db.query("INSERT INTO users VALUES ($1,$2,$3,'citizen')", [
    id,
    context.id,
    displayName,
  ]);
  await harness.db.query("INSERT INTO sessions VALUES ($1,$2,$3,$4)", [
    createHash("sha256").update(token).digest("hex"),
    context.id,
    id,
    new Date(Date.now() + 3600_000).toISOString(),
  ]);
  const agent = request.agent(harness.app.getHttpServer());
  agent.set("Cookie", `quenda_session=${token}`);
  return { id, agent };
}
/** A municipality offering resident and family tariffs on a court priced 5 € in general. */
async function pricedTenant() {
  const context = await tenant();
  await patch(context.manager, "manager/municipality", {
    enabledCategories: ["family", "resident", "minor"],
  }).expect(200);
  const court = await facility(context);
  await patch(context.manager, `manager/facilities/${court.id}`, {
    priceCents: 500,
    prices: [
      { category: "resident", priceCents: 300 },
      { category: "family", priceCents: 800 },
      { category: "minor", priceCents: 150 },
    ],
  }).expect(204);
  return { context, court };
}
describe("User categories and tariffs through HTTP and PostgreSQL", () => {
  it("prices the same slot differently for a verified resident and an unverified neighbour", async () => {
    const { context, court } = await pricedTenant();
    const neighbour = await citizen(context, "Neighbour");
    await post(context.citizen, "citizen/categories", {
      category: "resident",
    }).expect(201);
    await put(
      context.manager,
      `manager/citizens/${context.users.citizen}/categories/resident`,
      { status: "verified" },
    ).expect(200);
    const resident = await context.citizen
      .get(`/v2/citizen/tariffs/${court.id}`)
      .expect(200);
    const other = await neighbour.agent
      .get(`/v2/citizen/tariffs/${court.id}`)
      .expect(200);
    expect(resident.body).toEqual({ category: "resident", priceCents: 300 });
    expect(other.body).toEqual({ category: "general", priceCents: 500 });
    const first = await post(context.citizen, "citizen/bookings", {
      id: randomUUID(),
      facilityId: court.id,
      start: start(2, 10),
    }).expect(201);
    const second = await post(neighbour.agent, "citizen/bookings", {
      id: randomUUID(),
      facilityId: court.id,
      start: start(2, 11),
    }).expect(201);
    expect(first.body).toMatchObject({
      tariffCategory: "resident",
      priceCents: 300,
    });
    expect(second.body).toMatchObject({
      tariffCategory: "general",
      priceCents: 500,
    });
    // The price stays with the booking even after the category is revoked.
    await del(
      context.manager,
      `manager/citizens/${context.users.citizen}/categories/resident`,
    ).expect(204);
    const history = await context.citizen
      .get("/v2/citizen/bookings")
      .expect(200);
    expect(history.body[0]).toMatchObject({ priceCents: 300 });
    const after = await context.citizen
      .get(`/v2/citizen/tariffs/${court.id}`)
      .expect(200);
    expect(after.body).toEqual({ category: "general", priceCents: 500 });
  });
  it("applies the lowest verified tariff unless the person opts for the family one", async () => {
    const { context, court } = await pricedTenant();
    for (const category of ["resident", "minor", "family"])
      await put(
        context.manager,
        `manager/citizens/${context.users.citizen}/categories/${category}`,
        { status: "verified" },
      ).expect(200);
    const tariff = () =>
      context.citizen.get(`/v2/citizen/tariffs/${court.id}`).expect(200);
    expect((await tariff()).body).toEqual({
      category: "minor",
      priceCents: 150,
    });
    await put(context.citizen, "citizen/category-preference", {
      prefersFamilyTariff: true,
    }).expect(204);
    expect((await tariff()).body).toEqual({
      category: "family",
      priceCents: 800,
    });
    const mine = await context.citizen
      .get("/v2/citizen/categories")
      .expect(200);
    expect(mine.body.prefersFamilyTariff).toBe(true);
    expect(
      mine.body.categories.map((entry: { category: string }) => entry.category),
    ).toEqual(["resident", "family", "minor"]);
  });
  it("queues requests for the manager and audits every decision", async () => {
    const { context } = await pricedTenant();
    await post(context.citizen, "citizen/categories", {
      category: "senior",
    })
      .expect(422)
      .expect((response) =>
        expect(response.body.code).toBe("category_not_enabled"),
      );
    const requested = await post(context.citizen, "citizen/categories", {
      category: "resident",
    }).expect(201);
    expect(requested.body).toMatchObject({
      category: "resident",
      status: "requested",
      decidedAt: null,
    });
    await post(context.citizen, "citizen/categories", {
      category: "resident",
    })
      .expect(409)
      .expect((response) =>
        expect(response.body.code).toBe("category_already_requested"),
      );
    const queue = await context.manager
      .get("/v2/manager/category-requests")
      .expect(200);
    expect(queue.body).toEqual([
      expect.objectContaining({
        userId: context.users.citizen,
        category: "resident",
      }),
    ]);
    await put(
      context.manager,
      `manager/citizens/${context.users.citizen}/categories/resident`,
      { status: "rejected" },
    ).expect(200);
    expect(
      (await context.manager.get("/v2/manager/category-requests").expect(200))
        .body,
    ).toEqual([]);
    // A rejected category can be asked for again.
    await post(context.citizen, "citizen/categories", {
      category: "resident",
    }).expect(201);
    // Direct assignment needs no request.
    const found = await context.manager
      .get("/v2/manager/citizens?query=citiz")
      .expect(200);
    expect(found.body).toEqual([
      expect.objectContaining({ userId: context.users.citizen }),
    ]);
    await put(
      context.manager,
      `manager/citizens/${context.users.citizen}/categories/minor`,
      { status: "verified" },
    ).expect(200);
    const audit = await context.manager
      .get("/v2/manager/audit?limit=20")
      .expect(200);
    const actions = audit.body
      .map((event: { action: string }) => event.action)
      .filter((action: string) => action.startsWith("category."));
    expect(actions.sort()).toEqual(
      [
        "category.assigned",
        "category.rejected",
        "category.requested",
        "category.requested",
      ].sort(),
    );
  });
  it("keeps categories within the municipality and the manager role", async () => {
    const { context, court } = await pricedTenant();
    const other = await tenant();
    await context.citizen.get("/v2/manager/category-requests").expect(403);
    await put(
      context.citizen,
      `manager/citizens/${context.users.citizen}/categories/resident`,
      { status: "verified" },
    ).expect(403);
    // A manager elsewhere cannot see or verify this municipality's citizens.
    await put(
      other.manager,
      `manager/citizens/${context.users.citizen}/categories/resident`,
      { status: "verified" },
    ).expect(404);
    await other.citizen.get(`/v2/citizen/tariffs/${court.id}`).expect(404);
    await post(context.citizen, "citizen/categories", {
      category: "resident",
      tenantId: other.id,
    }).expect(400);
    // Managers are not citizens, so they hold no categories.
    await put(
      context.manager,
      `manager/citizens/${context.users.manager}/categories/resident`,
      { status: "verified" },
    ).expect(404);
  });
  it("exports categories and erases them with the account", async () => {
    const { context } = await pricedTenant();
    await put(
      context.manager,
      `manager/citizens/${context.users.citizen}/categories/resident`,
      { status: "verified" },
    ).expect(200);
    const exported = await context.citizen
      .get("/v2/citizen/me/export")
      .expect(200);
    expect(exported.body.categories).toEqual([
      expect.objectContaining({ category: "resident", status: "verified" }),
    ]);
    await del(context.citizen, "citizen/me").expect(204);
    const { rows } = await harness.db.query(
      "SELECT 1 FROM user_categories WHERE tenant_id=$1 AND user_id=$2",
      [context.id, context.users.citizen],
    );
    expect(rows).toEqual([]);
  });
  it("lists category prices in the public catalogue", async () => {
    const { context, court } = await pricedTenant();
    const catalog = await request(harness.app.getHttpServer())
      .get(`/v2/public/facilities?slug=${context.slug}`)
      .expect(200);
    expect(
      catalog.body.find((item: { id: string }) => item.id === court.id).prices,
    ).toEqual([
      { category: "resident", priceCents: 300 },
      { category: "family", priceCents: 800 },
      { category: "minor", priceCents: 150 },
    ]);
    const settings = await context.manager
      .get("/v2/manager/municipality")
      .expect(200);
    expect(settings.body.enabledCategories).toEqual([
      "resident",
      "family",
      "minor",
    ]);
  });
});
