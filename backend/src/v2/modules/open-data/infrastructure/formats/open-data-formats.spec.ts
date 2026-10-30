// SPDX-License-Identifier: AGPL-3.0-or-later
import { describe, expect, it } from "vitest";
import Ajv2020 from "ajv/dist/2020";
import addFormats from "ajv-formats";
import { openDataSchemas } from "../schemas/schemas";
import type { OpenFacility } from "../../domain/open-facility.read-model";
import { Publication } from "./publication";
import { facilitiesCsv } from "./facilities-csv";
import { facilitiesGeoJson } from "./facilities-geojson";
import { facilitiesJsonLd } from "./facilities-jsonld";
import { catalog, catalogJsonLd, catalogRdfXml } from "./dcat";
import { isoWeekStart, occupancyCsv, occupancyJson } from "./occupancy";
import type { OpenOccupancy } from "../../domain/open-occupancy.read-model";
const pool: OpenFacility = {
  id: "20000000-0000-4000-8000-000000000014",
  name: 'Piscina "O Río", cuberta',
  sport: "swimming",
  address: "Rúa do Río, 5",
  description: "Piscina de 25 metros.",
  accessible: true,
  status: "maintenance",
  slotMinutes: 60,
  priceCents: 250,
  latitude: 42.61,
  longitude: -8.12,
  courts: 1,
};
const court: OpenFacility = {
  ...pool,
  id: "20000000-0000-4000-8000-000000000012",
  name: "Pavillón",
  sport: "futsal",
  status: "active",
  priceCents: 0,
  latitude: null,
  longitude: null,
};
const publication = new Publication("https://reservas.example.gal", {
  municipality: {
    slug: "vilaverde",
    name: "Concello de Vilaverde",
    dataLicense: "CC-BY-4.0",
    dir3Code: "L01360000",
  },
  facilities: [pool, court],
  generatedOn: "2026-10-27",
});
const ajv = new Ajv2020({ strict: false });
addFormats(ajv);
describe("Open data formats", () => {
  it("should write RFC 4180 CSV with quoted cells, a decimal point and empty unknown coordinates", () => {
    const lines = facilitiesCsv(publication).split("\r\n");
    expect(lines[0]).toBe(
      "id,name,sport,cnid_class,cnid_type,schema_type,address,latitude,longitude,accessible,status,slot_minutes,price_eur,courts,url",
    );
    expect(lines[1]).toContain('"Piscina ""O Río"", cuberta"');
    expect(lines[1]).toContain(
      ',"Rúa do Río, 5",42.61,-8.12,true,maintenance,60,2.5,1,',
    );
    expect(lines[2]).toContain(",Pavillón,futsal,Pabellones,");
    expect(lines[2]).toContain(',"Rúa do Río, 5",,,true,');
    expect(lines.at(-1)).toBe("");
  });
  it("should put longitude first in GeoJSON points and leave the geometry null without coordinates", () => {
    const geo = facilitiesGeoJson(publication);
    expect(geo.features[0].geometry).toEqual({
      type: "Point",
      coordinates: [-8.12, 42.61],
    });
    expect(geo.features[1].geometry).toBeNull();
    expect(
      ajv.validate(openDataSchemas["facilities.geojson.schema.json"], geo),
    ).toBe(true);
  });
  it("should describe each facility with its schema.org type and CNID classification", () => {
    const list = facilitiesJsonLd(publication);
    expect(ajv.validate(openDataSchemas["facilities.schema.json"], list)).toBe(
      true,
    );
    expect(list.itemListElement[0].item).toMatchObject({
      "@type": "PublicSwimmingPool",
      url: "https://reservas.example.gal/app/vilaverde/instalacions/20000000-0000-4000-8000-000000000014",
      isAccessibleForFree: false,
    });
    expect(list.itemListElement[1].item).not.toHaveProperty("geo");
    expect(list.license).toBe("https://creativecommons.org/licenses/by/4.0/");
  });
  it("should list the same distributions in the JSON-LD and RDF/XML catalogues", () => {
    const model = catalog(publication);
    const jsonld = catalogJsonLd(model);
    const rdf = catalogRdfXml(model);
    const fromJson = jsonld["dcat:dataset"].flatMap((dataset) =>
      dataset["dcat:distribution"].map((distribution) => distribution["@id"]),
    );
    const fromXml = [
      ...rdf.matchAll(/<dcat:Distribution rdf:about="([^"]+)"/g),
    ].map((match) => match[1].replaceAll("&amp;", "&"));
    expect(fromXml).toEqual(fromJson);
    expect(fromJson).toHaveLength(5);
    expect(jsonld["dct:publisher"]["@id"]).toBe(
      "http://datos.gob.es/recurso/sector-publico/org/Organismo/L01360000",
    );
    expect(rdf).toContain(
      '<dcat:theme rdf:resource="http://datos.gob.es/kos/sector-publico/sector/deporte"/>',
    );
    expect(rdf).toContain(
      '<dct:title xml:lang="gl">Instalacións deportivas: Concello de Vilaverde</dct:title>',
    );
  });
  it("should escape XML special characters in the RDF/XML catalogue", () => {
    const rdf = catalogRdfXml(
      catalog(
        new Publication("https://reservas.example.gal", {
          ...publication.data,
          municipality: {
            ...publication.data.municipality,
            name: "A & <B>",
            dir3Code: null,
          },
        }),
      ),
    );
    expect(rdf).toContain(
      "<foaf:Agent><foaf:name>A &amp; &lt;B&gt;</foaf:name></foaf:Agent>",
    );
    expect(rdf).not.toMatch(/&(?!amp;|lt;|gt;|quot;)/);
  });
  it("should publish occupancy cells with the facility name, the ISO week start and a valid schema", () => {
    const occupancy = new Publication<OpenOccupancy>(
      "https://reservas.example.gal",
      {
        ...publication.data,
        timezone: "Europe/Madrid",
        from: "2026-10-05",
        to: "2026-10-11",
        facilities: [
          { id: court.id, name: "Pavillón, norte", sport: "futsal" },
        ],
        cells: [
          {
            facilityId: court.id,
            isoYear: 2026,
            isoWeek: 41,
            weekday: 3,
            hour: 18,
            openMinutes: 120,
            bookedMinutes: 60,
            noShowMinutes: 30,
            occupancy: 50,
          },
        ],
      },
    );
    const lines = occupancyCsv(occupancy).split("\r\n");
    expect(lines[0]).toBe(
      "facility_id,facility_name,sport,iso_year,iso_week,week_start,weekday,hour,open_minutes,booked_minutes,no_show_minutes,occupancy_pct",
    );
    expect(lines[1]).toBe(
      `${court.id},"Pavillón, norte",futsal,2026,41,2026-10-05,3,18,120,60,30,50`,
    );
    const json = occupancyJson(occupancy);
    expect(ajv.validate(openDataSchemas["occupancy.schema.json"], json)).toBe(
      true,
    );
    expect(json.license).toBe("https://creativecommons.org/licenses/by/4.0/");
  });
  it.each([
    [2026, 1, "2025-12-29"],
    [2026, 53, "2026-12-28"],
    [2027, 1, "2027-01-04"],
  ])("should place ISO week %i-%i on Monday %s", (year, week, monday) => {
    expect(isoWeekStart(year, week).toString()).toBe(monday);
  });
});
