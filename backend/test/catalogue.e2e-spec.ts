// SPDX-License-Identifier: AGPL-3.0-or-later
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import request from "supertest";
import { Temporal } from "@js-temporal/polyfill";
import {
  type Tenant,
  facility,
  harness,
  patch,
  post,
  setup,
  teardown,
  tenant,
} from "./harness";
import { courtPhoto } from "../src/database/seed-photo";
import { openingCalendar } from "../src/database/seed";
beforeAll(setup);
afterAll(teardown);
const ZONE = "Europe/Madrid";
const api = () => request(harness.app.getHttpServer());
/** 200 facilities: every tenth closed, every seventh in maintenance, padel and tennis alternating. */
async function crowded(context: Tenant) {
  await harness.db.query(
    `INSERT INTO facilities (id,tenant_id,name,sport,address,description,accessible,status,slot_minutes,price_cents,opening_calendar,rules)
    SELECT gen_random_uuid(), $1, 'Instalación ' || lpad(n::text, 3, '0'),
      CASE WHEN n % 2 = 0 THEN 'padel' ELSE 'tennis' END,
      CASE WHEN n % 5 = 0 THEN 'Rúa do Porto, ' || n ELSE 'Rúa Maior, ' || n END,
      'Instalación de proba', n % 3 = 0,
      CASE WHEN n % 10 = 0 THEN 'closed' WHEN n % 7 = 0 THEN 'maintenance' ELSE 'active' END,
      60, 0, $2, ''
    FROM generate_series(1, 200) AS n`,
    [context.id, openingCalendar("crowded")],
  );
}
function list(context: Tenant, query: Record<string, string | number>) {
  return api()
    .get("/v2/public/facilities")
    .query({ slug: context.slug, ...query });
}
function upload(
  context: Tenant,
  facilityId: string,
  body: Buffer,
  query: Record<string, string> = { altGl: "Pista cuberta" },
  contentType = "image/png",
) {
  return context.manager
    .post(`/v2/manager/facilities/${facilityId}/photos`)
    .query(query)
    .set("X-Quenda-Request", "1")
    .set("Content-Type", contentType)
    .send(body);
}
describe("Facility catalogue with server filters, pagination, photos and sports (#26)", () => {
  it("should list 200 facilities in pages filtered on the server, closed ones last", async () => {
    const context = await tenant();
    await crowded(context);
    const first = await list(context, { page: 1, pageSize: 12 }).expect(200);
    expect(first.body).toMatchObject({ total: 200, page: 1, pageSize: 12 });
    expect(first.body.items).toHaveLength(12);
    expect(
      first.body.items.every(
        (item: { status: string }) => item.status === "active",
      ),
    ).toBe(true);
    const last = await list(context, { page: 17, pageSize: 12 }).expect(200);
    expect(last.body.items).toHaveLength(8);
    expect(
      last.body.items.every(
        (item: { status: string }) => item.status === "closed",
      ),
    ).toBe(true);
    const beyond = await list(context, { page: 18, pageSize: 12 }).expect(200);
    expect(beyond.body).toMatchObject({ items: [], total: 200 });
    expect(
      (await list(context, { hideClosed: "true" }).expect(200)).body.total,
    ).toBe(180);
    expect(
      (await list(context, { sport: "tennis" }).expect(200)).body.total,
    ).toBe(100);
    expect(
      (await list(context, { accessible: "true" }).expect(200)).body.total,
    ).toBe(66);
    const found = await list(context, { q: "  porto ", sport: "padel" }).expect(
      200,
    );
    expect(found.body.total).toBe(20);
    expect(found.body.items[0]).toMatchObject({
      sport: "padel",
      sportName: { gl: "Pádel", es: "Pádel" },
      photos: [],
    });
    await list(context, { pageSize: 51 }).expect(400);
    await list(context, { page: 0 }).expect(400);
    await list(context, { sport: "Pádel!" }).expect(400);
    await api()
      .get("/v2/public/facilities")
      .query({ slug: "missing" })
      .expect(404);
    // The cross-municipality catalogue (#18) pages the same way, active facilities only.
    const catalog = await api()
      .get("/v2/public/catalog")
      .query({ municipality: context.slug, pageSize: 5, page: 2 })
      .expect(200);
    expect(catalog.body).toMatchObject({ total: 154, page: 2, pageSize: 5 });
    expect(catalog.body.items).toHaveLength(5);
  });
  it("should let the municipality add, rename and hide sports of its own catalogue", async () => {
    const context = await tenant();
    const other = await tenant();
    const sports = await context.manager.get("/v2/manager/sports").expect(200);
    expect(sports.body).toHaveLength(12);
    expect(
      sports.body.filter((sport: { hidden: boolean }) => !sport.hidden),
    ).toHaveLength(4);
    const added = await post(context.manager, "manager/sports", {
      code: "boccia",
      name: { gl: " Boccia ", es: "Boccia" },
      cnidClass: "Salas",
      cnidType: "Sala polivalente",
    }).expect(201);
    expect(added.body).toMatchObject({
      code: "boccia",
      name: { gl: "Boccia" },
      hidden: false,
      schemaType: "SportsActivityLocation",
    });
    await post(context.manager, "manager/sports", {
      code: "boccia",
      name: { gl: "Boccia", es: "Boccia" },
    }).expect(409);
    await post(context.manager, "manager/sports", {
      code: "Boccia",
      name: { gl: "Boccia", es: "Boccia" },
    }).expect(400);
    await post(context.citizen, "manager/sports", {
      code: "curling",
      name: { gl: "Curling", es: "Curling" },
    }).expect(403);
    const court = await facility(context);
    await patch(context.manager, `manager/facilities/${court.id}`, {
      sport: "boccia",
    }).expect(204);
    await patch(context.manager, `manager/facilities/${court.id}`, {
      sport: "curling",
    }).expect(400);
    // Each municipality has its own catalogue.
    const elsewhere = await facility(other);
    await patch(other.manager, `manager/facilities/${elsewhere.id}`, {
      sport: "boccia",
    }).expect(400);
    await patch(context.manager, "manager/sports/boccia", {
      name: { gl: "Boccia adaptada", es: "Boccia adaptada" },
      hidden: true,
    }).expect(200);
    const visible = await api()
      .get("/v2/public/sports")
      .query({ municipality: context.slug })
      .expect(200);
    expect(visible.body.map((sport: { code: string }) => sport.code)).toEqual([
      "padel",
      "tennis",
      "futsal",
      "swimming",
    ]);
    // Hiding takes the sport out of filters; the facility that uses it keeps it.
    const listed = await list(context, { sport: "boccia" }).expect(200);
    expect(listed.body.items[0]).toMatchObject({
      id: court.id,
      sport: "boccia",
      sportName: { gl: "Boccia adaptada" },
    });
    await patch(context.manager, "manager/sports/missing", {
      hidden: true,
    }).expect(404);
    const audit = await harness.db.query<{ action: string }>(
      "SELECT action FROM audit_events WHERE tenant_id=$1 AND action LIKE 'sport.%' ORDER BY occurred_at",
      [context.id],
    );
    expect(audit.rows.map((row) => row.action)).toEqual([
      "sport.created",
      "sport.updated",
    ]);
  });
  it("should keep up to ten photos per facility, each with alternative text", async () => {
    const context = await tenant();
    const court = await facility(context);
    const created = await upload(context, court.id, courtPhoto(64, 40), {
      altGl: "Pista vista desde a bancada",
      altEs: "Pista vista desde la grada",
    }).expect(201);
    const details = await api()
      .get(`/v2/public/facilities/${court.id}`)
      .query({ slug: context.slug })
      .expect(200);
    expect(details.body.photos).toEqual([
      {
        id: created.body.id,
        url: expect.stringMatching(
          new RegExp(
            `^/v2/public/facilities/${court.id}/photos/${created.body.id}\\?v=[0-9a-f]{16}$`,
          ),
        ),
        alt: {
          gl: "Pista vista desde a bancada",
          es: "Pista vista desde la grada",
        },
        position: 0,
      },
    ]);
    const image = await api().get(details.body.photos[0].url).expect(200);
    expect(image.headers["content-type"]).toBe("image/png");
    expect(image.headers["cache-control"]).toBe(
      "public, max-age=31536000, immutable",
    );
    await upload(context, court.id, courtPhoto(8, 8), { altGl: "  " }).expect(
      400,
    );
    await upload(context, court.id, courtPhoto(8, 8), {}).expect(400);
    await upload(
      context,
      court.id,
      courtPhoto(8, 8),
      { altGl: "Foto" },
      "image/jpeg",
    ).expect(415);
    const large = Buffer.concat([courtPhoto(8, 8), Buffer.alloc(4_300_000)]);
    await upload(context, court.id, large).expect(413);
    await context.citizen
      .post(`/v2/manager/facilities/${court.id}/photos`)
      .query({ altGl: "Foto" })
      .set("X-Quenda-Request", "1")
      .set("Content-Type", "image/png")
      .send(courtPhoto(8, 8))
      .expect(403);
    for (let index = 1; index < 10; index++)
      await upload(context, court.id, courtPhoto(8 + index, 8), {
        altGl: `Foto ${index}`,
      }).expect(201);
    await upload(context, court.id, courtPhoto(30, 8)).expect(409);
    await patch(
      context.manager,
      `manager/facilities/${court.id}/photos/${created.body.id}`,
      { alt: { gl: "Bancada e pista", es: "" }, position: 20 },
    ).expect(204);
    await patch(
      context.manager,
      `manager/facilities/${court.id}/photos/${created.body.id}`,
      { alt: { gl: "", es: "" }, position: 0 },
    ).expect(400);
    const reordered = await list(context, {}).expect(200);
    const photos = reordered.body.items[0].photos as {
      id: string;
      alt: { gl: string };
    }[];
    expect(photos).toHaveLength(10);
    expect(photos[9]).toMatchObject({
      id: created.body.id,
      alt: { gl: "Bancada e pista" },
    });
    await context.manager
      .delete(`/v2/manager/facilities/${court.id}/photos/${created.body.id}`)
      .set("X-Quenda-Request", "1")
      .expect(204);
    await api().get(details.body.photos[0].url).expect(404);
    const audit = await harness.db.query<{ count: string }>(
      "SELECT count(*) FROM audit_events WHERE tenant_id=$1 AND action LIKE 'facility.photo_%'",
      [context.id],
    );
    expect(Number(audit.rows[0].count)).toBe(12);
  });
  it("should give the facility page its opening hours for the coming week", async () => {
    const context = await tenant();
    const court = await facility(context);
    const today = Temporal.Now.zonedDateTimeISO(ZONE).toPlainDate();
    const holiday = today.add({ days: 2 });
    await harness.db.query(
      "UPDATE municipalities SET holidays_calendar=$2 WHERE id=$1",
      [
        context.id,
        [
          "BEGIN:VCALENDAR",
          "VERSION:2.0",
          "PRODID:-//Quenda//Holidays//GL",
          "BEGIN:VEVENT",
          "UID:holiday@quenda",
          "DTSTAMP:20260101T000000Z",
          `DTSTART;VALUE=DATE:${holiday.toString().replaceAll("-", "")}`,
          "SUMMARY:Festa local",
          "END:VEVENT",
          "END:VCALENDAR",
          "",
        ].join("\r\n"),
      ],
    );
    const details = await api()
      .get(`/v2/public/facilities/${court.id}`)
      .query({ slug: context.slug })
      .expect(200);
    expect(details.body.openingWeek).toHaveLength(7);
    expect(details.body.openingWeek[0]).toEqual({
      date: today.toString(),
      hours: today.toString().endsWith("12-25")
        ? []
        : [{ from: "09:00", to: "22:00" }],
      holiday: false,
    });
    expect(details.body.openingWeek[2]).toEqual({
      date: holiday.toString(),
      hours: [],
      holiday: true,
    });
    await patch(context.manager, `manager/facilities/${court.id}`, {
      status: "maintenance",
    }).expect(204);
    const closed = await api()
      .get(`/v2/public/facilities/${court.id}`)
      .query({ slug: context.slug })
      .expect(200);
    expect(closed.body).toMatchObject({ status: "maintenance" });
    expect(
      closed.body.openingWeek.every(
        (day: { hours: unknown[] }) => day.hours.length === 0,
      ),
    ).toBe(true);
    const other = await tenant();
    await api()
      .get(`/v2/public/facilities/${court.id}`)
      .query({ slug: other.slug })
      .expect(404);
    const managed = await context.manager
      .get("/v2/manager/facilities")
      .expect(200);
    expect(managed.body.map((item: { id: string }) => item.id)).toEqual([
      court.id,
    ]);
    await context.citizen.get("/v2/manager/facilities").expect(403);
  });
  it("should tell the frontends which map tiles to load", async () => {
    const map = await api().get("/v2/public/map").expect(200);
    expect(map.body).toEqual({
      tileUrl: "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
      attribution: "© OpenStreetMap contributors",
    });
  });
});
