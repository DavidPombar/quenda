// SPDX-License-Identifier: AGPL-3.0-or-later
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { randomUUID } from "node:crypto";
import request from "supertest";
import {
  type Agent,
  type Tenant,
  facility,
  harness,
  patch,
  post,
  setup,
  teardown,
  tenant,
} from "./harness";
beforeAll(setup);
afterAll(teardown);
interface Sport {
  code: string;
  name: { gl: string; es: string };
  cnidClass: string;
  cnidType: string;
  schemaType: string;
  art: string;
  visible: boolean;
  position: number;
}
const draft = ({ name, position: _position, ...sport }: Sport) => ({
  ...sport,
  nameGl: name.gl,
  nameEs: name.es,
});
function save(agent: Agent, sports: ReturnType<typeof draft>[]) {
  return agent
    .put("/v2/manager/sports")
    .set("X-Quenda-Request", "1")
    .send({ sports });
}
async function managed(context: Tenant) {
  return (await context.manager.get("/v2/manager/sports").expect(200))
    .body as Sport[];
}
function publicSports(slug?: string) {
  return request(harness.app.getHttpServer())
    .get("/v2/public/sports")
    .query(slug ? { municipality: slug } : {})
    .expect(200);
}
describe("Sports catalogue per municipality (#26)", () => {
  it("should start every municipality with the CNID list, the V0 sports first", async () => {
    const context = await tenant();
    const sports = await managed(context);
    expect(sports.slice(0, 4).map((sport) => sport.code)).toEqual([
      "padel",
      "tennis",
      "futsal",
      "swimming",
    ]);
    expect(sports.length).toBeGreaterThanOrEqual(15);
    expect(sports.find((sport) => sport.code === "handball")).toMatchObject({
      name: { gl: "Balonmán", es: "Balonmano" },
      cnidClass: "Pabellones",
      art: "generic",
      visible: true,
    });
  });
  it("should let a manager add, rename and hide sports, and label facilities with the new names", async () => {
    const context = await tenant();
    const court = await facility(context);
    const current = await managed(context);
    const edited = current.map((sport) =>
      sport.code === "padel"
        ? { ...draft(sport), nameGl: "Pádel cuberto" }
        : sport.code === "tennis"
          ? { ...draft(sport), visible: false }
          : draft(sport),
    );
    const chess = {
      code: "chess",
      nameGl: "Xadrez",
      nameEs: "Ajedrez",
      cnidClass: "Salas",
      cnidType: "Sala polivalente",
      schemaType: "SportsActivityLocation",
      art: "generic",
      visible: true,
    };
    const saved = await save(context.manager, [chess, ...edited]).expect(200);
    expect((saved.body as Sport[])[0]).toMatchObject({
      code: "chess",
      position: 0,
    });
    // Filters list only sports that some facility offers.
    expect(
      ((await publicSports(context.slug)).body as Sport[]).map(
        (sport) => sport.code,
      ),
    ).toEqual(["padel"]);
    expect(
      (await managed(context))
        .filter((sport) => sport.visible)
        .map((sport) => sport.code),
    ).not.toContain("tennis");
    const listed = await context.citizen
      .get("/v2/public/facilities")
      .query({ slug: context.slug })
      .expect(200);
    expect(
      listed.body.find((item: { id: string }) => item.id === court.id),
    ).toMatchObject({
      sport: "padel",
      sportName: { gl: "Pádel cuberto", es: "Pádel" },
      sportArt: "padel",
    });
    const catalog = await context.citizen
      .get("/v2/public/catalog")
      .query({ municipality: context.slug, sport: "padel" })
      .expect(200);
    expect(catalog.body[0].sportName.gl).toBe("Pádel cuberto");
    const audit = await harness.db.query(
      "SELECT details FROM audit_events WHERE tenant_id=$1 AND action='municipality.sports_updated'",
      [context.id],
    );
    expect(audit.rows).toHaveLength(1);
  });
  it("should offer only visible sports for new facilities and keep hidden ones on existing facilities", async () => {
    const context = await tenant();
    const court = await facility(context);
    const current = await managed(context);
    await save(
      context.manager,
      current.map((sport) =>
        sport.code === "padel"
          ? { ...draft(sport), visible: false }
          : draft(sport),
      ),
    ).expect(200);
    const body = { ...court, id: randomUUID(), name: "Outra pista" };
    expect(
      (await post(context.manager, "manager/facilities", body).expect(422)).body
        .code,
    ).toBe("sport_unknown");
    await post(context.manager, "manager/facilities", {
      ...body,
      sport: "chess-unknown",
    }).expect(422);
    await post(context.manager, "manager/facilities", {
      ...body,
      sport: "basketball",
    }).expect(201);
    // The existing padel court keeps its hidden sport while other fields change.
    await patch(context.manager, `manager/facilities/${court.id}`, {
      name: "Pista renomeada",
    }).expect(204);
    await patch(context.manager, `manager/facilities/${court.id}`, {
      sport: "tennis",
    }).expect(204);
    await patch(context.manager, `manager/facilities/${court.id}`, {
      sport: "padel",
    }).expect(422);
  });
  it("should refuse to remove a sport in use and validate the catalogue", async () => {
    const context = await tenant();
    await facility(context);
    const current = (await managed(context)).map(draft);
    expect(
      (
        await save(
          context.manager,
          current.filter((sport) => sport.code !== "padel"),
        ).expect(409)
      ).body.code,
    ).toBe("sport_in_use");
    await save(
      context.manager,
      current.filter((sport) => sport.code !== "squash"),
    ).expect(200);
    await save(context.manager, []).expect(400);
    await save(context.manager, [
      ...current,
      { ...current[0], code: "padel-2", nameEs: "otro" },
    ]).expect(400);
    await save(
      context.manager,
      current.map((sport) => ({ ...sport, visible: false })),
    ).expect(400);
    await save(context.citizen, current).expect(403);
  });
  it("should keep each municipality's catalogue apart and share visible codes across them", async () => {
    const one = await tenant();
    const other = await tenant();
    await facility(one);
    await facility(other);
    const current = await managed(one);
    await save(one.manager, [
      ...current.map(draft),
      {
        code: "chess",
        nameGl: "Xadrez",
        nameEs: "Ajedrez",
        cnidClass: "Salas",
        cnidType: "Sala polivalente",
        schemaType: "SportsActivityLocation",
        art: "generic",
        visible: true,
      },
    ]).expect(200);
    expect((await managed(other)).map((sport) => sport.code)).not.toContain(
      "chess",
    );
    expect(
      (
        (await publicSports(`${one.slug},${other.slug}`)).body as Sport[]
      ).filter((sport) => sport.code === "padel"),
    ).toHaveLength(1);
  });
  it("should publish the edited CNID classification as open data", async () => {
    const context = await tenant();
    await facility(context);
    const current = await managed(context);
    await save(
      context.manager,
      current.map((sport) =>
        sport.code === "padel"
          ? { ...draft(sport), cnidType: "Pista de pádel cuberta" }
          : draft(sport),
      ),
    ).expect(200);
    const csv = await request(harness.app.getHttpServer())
      .get("/v2/public/open-data/facilities.csv")
      .query({ slug: context.slug })
      .expect(200);
    expect(csv.text).toContain(",Pistas,Pista de pádel cuberta,");
  });
});
