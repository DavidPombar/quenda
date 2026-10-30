// SPDX-License-Identifier: AGPL-3.0-or-later
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { randomUUID } from "node:crypto";
import request from "supertest";
import Ajv2020 from "ajv/dist/2020";
import addFormats from "ajv-formats";
import { Temporal } from "@js-temporal/polyfill";
import {
  addResources,
  facility,
  harness,
  patch,
  post,
  setup,
  start,
  teardown,
  tenant,
} from "./harness";
beforeAll(setup);
afterAll(teardown);
const ajv = new Ajv2020({ strict: false });
addFormats(ajv);
// Loosely typed JSON-LD node for property assertions.
type Node = { [key: string]: Node & Node[] & string };
const anonymous = () => request(harness.app.getHttpServer());
async function schema(name: string) {
  return (
    await anonymous().get(`/v2/public/open-data/schemas/${name}`).expect(200)
  ).body as object;
}
function open(
  file: string,
  slug: string,
  range: { from?: string; to?: string } = {},
) {
  return anonymous()
    .get(`/v2/public/open-data/${file}`)
    .query({ slug, ...range })
    .buffer(true)
    .parse((response, callback) => {
      let text = "";
      response.setEncoding("utf8");
      response.on("data", (chunk: string) => (text += chunk));
      response.on("end", () => callback(null, text));
    });
}
describe("Open data", () => {
  it("should publish every facility of the municipality in JSON-LD, CSV and GeoJSON that validate against their schemas", async () => {
    const context = await tenant();
    const placed = await facility(context);
    await patch(context.manager, `manager/facilities/${placed.id}`, {
      latitude: 42.61,
      longitude: -8.12,
    }).expect(204);
    const hall = await facility(context);
    await addResources(context, hall.id, [
      { name: "Tercio A", parentId: hall.id },
      { name: "Tercio B", parentId: hall.id },
    ]);
    const other = await tenant();
    const foreign = await facility(other);

    const json = await open("facilities.json", context.slug).expect(200);
    expect(json.headers["content-type"]).toMatch(/^application\/ld\+json/);
    const list = JSON.parse(json.body as string) as {
      numberOfItems: number;
      itemListElement: { item: { identifier: string } }[];
    };
    expect(
      ajv.validate(await schema("facilities.schema.json"), list),
      ajv.errorsText(),
    ).toBe(true);
    expect(list.numberOfItems).toBe(2);
    expect(JSON.stringify(list)).not.toContain(foreign.id);

    const geo = await open("facilities.geojson", context.slug).expect(200);
    expect(geo.headers["content-type"]).toMatch(/^application\/geo\+json/);
    const collection = JSON.parse(geo.body as string) as {
      features: {
        id: string;
        geometry: unknown;
        properties: { courts: number };
      }[];
    };
    expect(
      ajv.validate(await schema("facilities.geojson.schema.json"), collection),
      ajv.errorsText(),
    ).toBe(true);
    const byId = new Map(collection.features.map((f) => [f.id, f]));
    expect(byId.get(placed.id)?.geometry).toEqual({
      type: "Point",
      coordinates: [-8.12, 42.61],
    });
    expect(byId.get(hall.id)?.geometry).toBeNull();
    // A divisible hall is one court; its parts are not counted separately.
    expect(byId.get(hall.id)?.properties.courts).toBe(1);

    const csv = await open("facilities.csv", context.slug).expect(200);
    expect(csv.headers["content-type"]).toMatch(/^text\/csv/);
    const table = (await schema("facilities.tableschema.json")) as {
      fields: {
        name: string;
        type: string;
        constraints: { required?: boolean };
      }[];
    };
    const [header, ...rows] = (csv.body as string)
      .split("\r\n")
      .filter(Boolean)
      .map((line) => line.split(","));
    expect(header).toEqual(table.fields.map((field) => field.name));
    expect(rows).toHaveLength(2);
    for (const row of rows)
      table.fields.forEach((field, index) => {
        const value = row[index];
        if (value === "")
          return expect(field.constraints.required).not.toBe(true);
        if (field.type === "number")
          expect(Number.isFinite(Number(value))).toBe(true);
        if (field.type === "integer") expect(value).toMatch(/^\d+$/);
        if (field.type === "boolean")
          expect(["true", "false"]).toContain(value);
      });
  });
  it("should let any origin reuse and cache the files without cookies", async () => {
    const context = await tenant();
    for (const file of [
      "facilities.json",
      "facilities.csv",
      "facilities.geojson",
      "catalog.jsonld",
      "catalog.rdf",
      "occupancy.json",
      "occupancy.csv",
    ]) {
      const response = await open(file, context.slug).expect(200);
      expect(response.headers["access-control-allow-origin"]).toBe("*");
      expect(response.headers["cross-origin-resource-policy"]).toBe(
        "cross-origin",
      );
      expect(response.headers["cache-control"]).toBe("public, max-age=300");
      expect(response.headers["set-cookie"]).toBeUndefined();
    }
  });
  it("should describe the same distributions under the municipality's licence in both DCAT catalogues", async () => {
    const context = await tenant();
    await harness.db.query(
      "UPDATE municipalities SET data_license='CC0-1.0', dir3_code='L01360000' WHERE id=$1",
      [context.id],
    );
    const jsonld = await open("catalog.jsonld", context.slug).expect(200);
    const catalog = JSON.parse(jsonld.body as string) as Node;
    expect(catalog["@type"]).toBe("dcat:Catalog");
    expect(catalog["dct:license"]["@id"]).toBe(
      "https://creativecommons.org/publicdomain/zero/1.0/",
    );
    expect(catalog["dct:publisher"]["@id"]).toBe(
      "http://datos.gob.es/recurso/sector-publico/org/Organismo/L01360000",
    );
    const dataset = catalog["dcat:dataset"][0];
    for (const property of [
      "dct:title",
      "dct:description",
      "dcat:theme",
      "dcat:keyword",
      "dct:identifier",
      "dcat:distribution",
    ])
      expect(dataset[property]).toBeDefined();
    expect(dataset["dcat:distribution"]).toHaveLength(3);
    const occupancy = catalog["dcat:dataset"][1];
    expect(occupancy["dct:identifier"]).toBe(
      `${context.slug}-ocupacion-instalacions-deportivas`,
    );
    const distributions = (catalog["dcat:dataset"] as unknown as Node[])
      .flatMap((item) => item["dcat:distribution"] as unknown as Node[])
      .map((distribution) => distribution["@id"]);
    expect(distributions).toHaveLength(5);

    const rdf = await open("catalog.rdf", context.slug).expect(200);
    expect(rdf.headers["content-type"]).toMatch(/^application\/rdf\+xml/);
    const xml = rdf.body as string;
    expect(xml).toMatch(
      /^<\?xml version="1\.0" encoding="UTF-8"\?>\n<rdf:RDF /,
    );
    expect(xml.trimEnd().endsWith("</rdf:RDF>")).toBe(true);
    expect(
      [...xml.matchAll(/<dcat:Distribution rdf:about="([^"]+)"/g)].map(
        (match) => match[1].replaceAll("&amp;", "&"),
      ),
    ).toEqual(distributions);
    expect(xml).toContain(
      '<dct:license rdf:resource="https://creativecommons.org/publicdomain/zero/1.0/"/>',
    );
    // Every distribution URL can be downloaded.
    for (const url of distributions)
      await anonymous()
        .get(new URL(url).pathname + new URL(url).search)
        .expect(200);
  });
  it("should answer not found for an unknown municipality and an unknown schema", async () => {
    await open("facilities.json", "missing-municipality").expect(404);
    await anonymous()
      .get("/v2/public/open-data/schemas/other.json")
      .expect(400);
  });
  it("should reject coordinates that are out of range or set alone", async () => {
    const context = await tenant();
    const placed = await facility(context);
    await patch(context.manager, `manager/facilities/${placed.id}`, {
      latitude: 91,
      longitude: 0,
    }).expect(400);
    await patch(context.manager, `manager/facilities/${placed.id}`, {
      latitude: 42.6,
    }).expect(400);
    await post(context.manager, "manager/facilities", {
      ...placed,
      id: randomUUID(),
      latitude: 42.6,
      longitude: -8.1,
    }).expect(201);
  });
  it("should document every open data route with its media type in OpenAPI", async () => {
    const document = (await anonymous().get("/api/openapi.json").expect(200))
      .body as {
      paths: Record<
        string,
        {
          get: {
            responses: Record<string, { content: Record<string, unknown> }>;
          };
        }
      >;
    };
    for (const [file, type] of [
      ["facilities.json", "application/ld+json"],
      ["facilities.csv", "text/csv"],
      ["facilities.geojson", "application/geo+json"],
      ["catalog.jsonld", "application/ld+json"],
      ["catalog.rdf", "application/rdf+xml"],
      ["occupancy.json", "application/json"],
      ["occupancy.csv", "text/csv"],
    ])
      expect(
        document.paths[`/v2/public/open-data/${file}`].get.responses["200"]
          .content[type],
      ).toBeDefined();
  });
  it("should publish aggregated occupancy per facility, ISO week, weekday and hour without booking or person identifiers", async () => {
    const context = await tenant();
    const court = await facility(context);
    const begins = start(2, 10);
    const bookingId = randomUUID();
    await post(context.citizen, "citizen/bookings", {
      id: bookingId,
      facilityId: court.id,
      start: begins,
    }).expect(201);
    const local =
      Temporal.Instant.from(begins).toZonedDateTimeISO("Europe/Madrid");
    const date = local.toPlainDate().toString();
    const json = await open("occupancy.json", context.slug, {
      from: date,
      to: date,
    }).expect(200);
    expect(json.headers["content-type"]).toMatch(/^application\/json/);
    const body = JSON.parse(json.body as string) as {
      from: string;
      to: string;
      license: string;
      cells: {
        facility_id: string;
        iso_week: number;
        weekday: number;
        hour: number;
        open_minutes: number;
        booked_minutes: number;
        occupancy_pct: number;
      }[];
    };
    expect(
      ajv.validate(await schema("occupancy.schema.json"), body),
      ajv.errorsText(),
    ).toBe(true);
    expect(body).toMatchObject({ from: date, to: date });
    // Open 09:00–22:00 every day: 13 hourly cells, the booked one full.
    expect(body.cells).toHaveLength(13);
    expect(body.cells.find((cell) => cell.hour === 10)).toMatchObject({
      facility_id: court.id,
      iso_week: local.weekOfYear,
      weekday: local.dayOfWeek,
      open_minutes: 60,
      booked_minutes: 60,
      occupancy_pct: 100,
    });
    expect(json.body).not.toContain(bookingId);
    expect(json.body).not.toContain(context.users.citizen);

    const csv = await open("occupancy.csv", context.slug, {
      from: date,
      to: date,
    }).expect(200);
    const table = (await schema("occupancy.tableschema.json")) as {
      fields: { name: string; type: string }[];
    };
    const [header, ...rows] = (csv.body as string)
      .split("\r\n")
      .filter(Boolean)
      .map((line) => line.split(","));
    expect(header).toEqual(table.fields.map((field) => field.name));
    expect(rows).toHaveLength(13);
    for (const row of rows)
      table.fields.forEach((field, index) => {
        if (field.type === "integer") expect(row[index]).toMatch(/^\d+$/);
        if (field.type === "date")
          expect(row[index]).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      });
  });
  it("should default to the last 12 complete ISO weeks and reject an invalid range", async () => {
    const context = await tenant();
    const body = JSON.parse(
      (await open("occupancy.json", context.slug).expect(200)).body as string,
    ) as { from: string; to: string };
    const today = Temporal.Now.plainDateISO("Europe/Madrid");
    const lastSunday = today.subtract({ days: today.dayOfWeek });
    expect(body.to).toBe(lastSunday.toString());
    expect(body.from).toBe(lastSunday.subtract({ days: 83 }).toString());
    expect(Temporal.PlainDate.from(body.from).dayOfWeek).toBe(1);
    await open("occupancy.json", context.slug, { from: "2026-10-01" }).expect(
      400,
    );
    await open("occupancy.json", context.slug, {
      from: "2026-10-10",
      to: "2026-10-01",
    }).expect(400);
    await open("occupancy.csv", context.slug, {
      from: "2024-01-01",
      to: "2026-01-01",
    }).expect(400);
    await open("occupancy.json", "missing-municipality").expect(404);
  });
  it("should publish under the licence and DIR3 code a manager sets in the settings", async () => {
    const context = await tenant();
    await patch(context.manager, "manager/municipality", {
      dataLicense: "CC-BY-SA-4.0",
      dir3Code: "l01360000",
    }).expect(200);
    await patch(context.manager, "manager/municipality", {
      dir3Code: "L0136",
    }).expect(400);
    const catalog = JSON.parse(
      (await open("catalog.jsonld", context.slug).expect(200)).body as string,
    ) as Node;
    expect(catalog["dct:license"]["@id"]).toBe(
      "https://creativecommons.org/licenses/by-sa/4.0/",
    );
    expect(catalog["dct:publisher"]["@id"]).toBe(
      "http://datos.gob.es/recurso/sector-publico/org/Organismo/L01360000",
    );
    const occupancy = JSON.parse(
      (await open("occupancy.json", context.slug).expect(200)).body as string,
    ) as { license: string };
    expect(occupancy.license).toBe(
      "https://creativecommons.org/licenses/by-sa/4.0/",
    );
    await patch(context.manager, "manager/municipality", {
      dir3Code: null,
    }).expect(200);
    const cleared = JSON.parse(
      (await open("catalog.jsonld", context.slug).expect(200)).body as string,
    ) as Node;
    expect(cleared["dct:publisher"]["@id"]).toBeUndefined();
    await patch(context.citizen, "manager/municipality", {
      dataLicense: "CC0-1.0",
    }).expect(403);
  });
});
