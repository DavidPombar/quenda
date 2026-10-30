// SPDX-License-Identifier: AGPL-3.0-or-later
/**
 * Published schemas of the open data files. They are served at
 * /v2/public/open-data/schemas/{name} and the HTTP tests validate every file against them.
 */
// Sports come from each municipality's catalogue: a code of lowercase letters, digits and dashes.
const sportCode = "^[a-z0-9-]{2,40}$";
const statuses = ["active", "maintenance", "closed"];
const nullableNumber = (minimum: number, maximum: number) => ({
  type: ["number", "null"],
  minimum,
  maximum,
});
const record = {
  type: "object",
  additionalProperties: false,
  required: [
    "id",
    "name",
    "sport",
    "cnid_class",
    "cnid_type",
    "schema_type",
    "address",
    "latitude",
    "longitude",
    "accessible",
    "status",
    "slot_minutes",
    "price_eur",
    "courts",
    "url",
  ],
  properties: {
    id: { type: "string", format: "uuid" },
    name: { type: "string", minLength: 1 },
    sport: { type: "string", pattern: sportCode },
    cnid_class: { type: "string", minLength: 1 },
    cnid_type: { type: "string", minLength: 1 },
    schema_type: { type: "string", pattern: "^[A-Z][A-Za-z]+$" },
    address: { type: "string", minLength: 1 },
    latitude: nullableNumber(-90, 90),
    longitude: nullableNumber(-180, 180),
    accessible: { type: "boolean" },
    status: { enum: statuses },
    slot_minutes: { enum: [30, 60, 90, 120] },
    price_eur: { type: "number", minimum: 0 },
    courts: { type: "integer", minimum: 0 },
    url: { type: "string", format: "uri" },
  },
};
const facilitiesJson = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  $id: "facilities.schema.json",
  title: "Quenda facilities (schema.org JSON-LD)",
  type: "object",
  required: [
    "@context",
    "@type",
    "license",
    "numberOfItems",
    "itemListElement",
  ],
  properties: {
    "@context": { const: "https://schema.org" },
    "@type": { const: "ItemList" },
    "@id": { type: "string", format: "uri" },
    name: { type: "string" },
    license: { type: "string", format: "uri" },
    numberOfItems: { type: "integer", minimum: 0 },
    itemListElement: {
      type: "array",
      items: {
        type: "object",
        required: ["@type", "position", "item"],
        properties: {
          "@type": { const: "ListItem" },
          position: { type: "integer", minimum: 1 },
          item: {
            type: "object",
            required: [
              "@type",
              "identifier",
              "name",
              "url",
              "address",
              "amenityFeature",
              "additionalProperty",
            ],
            properties: {
              "@type": { type: "string", pattern: "^[A-Z][A-Za-z]+$" },
              identifier: { type: "string", format: "uuid" },
              name: { type: "string", minLength: 1 },
              url: { type: "string", format: "uri" },
              isAccessibleForFree: { type: "boolean" },
              address: {
                type: "object",
                required: ["@type", "streetAddress", "addressLocality"],
                properties: { "@type": { const: "PostalAddress" } },
              },
              geo: {
                type: "object",
                required: ["@type", "latitude", "longitude"],
                properties: {
                  "@type": { const: "GeoCoordinates" },
                  latitude: { type: "number", minimum: -90, maximum: 90 },
                  longitude: { type: "number", minimum: -180, maximum: 180 },
                },
              },
              amenityFeature: { type: "array" },
              additionalProperty: {
                type: "array",
                items: {
                  type: "object",
                  required: ["@type", "name", "value"],
                  properties: { "@type": { const: "PropertyValue" } },
                },
              },
            },
          },
        },
      },
    },
  },
};
/** RFC 7946 subset: Point or null geometries, with the CSV record as properties. */
const facilitiesGeoJson = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  $id: "facilities.geojson.schema.json",
  title: "Quenda facilities (GeoJSON, RFC 7946)",
  type: "object",
  required: ["type", "features"],
  properties: {
    type: { const: "FeatureCollection" },
    features: {
      type: "array",
      items: {
        type: "object",
        required: ["type", "geometry", "properties"],
        properties: {
          type: { const: "Feature" },
          id: { type: "string", format: "uuid" },
          geometry: {
            oneOf: [
              { type: "null" },
              {
                type: "object",
                required: ["type", "coordinates"],
                additionalProperties: false,
                properties: {
                  type: { const: "Point" },
                  coordinates: {
                    type: "array",
                    minItems: 2,
                    maxItems: 2,
                    prefixItems: [
                      { type: "number", minimum: -180, maximum: 180 },
                      { type: "number", minimum: -90, maximum: 90 },
                    ],
                  },
                },
              },
            ],
          },
          properties: record,
        },
      },
    },
  },
};
const field = (
  name: string,
  type: string,
  description: string,
  constraints: Record<string, unknown> = {},
) => ({ name, type, description, constraints });
/** Frictionless Table Schema of facilities.csv. */
const facilitiesTable = {
  $schema: "https://specs.frictionlessdata.io/schemas/table-schema.json",
  fields: [
    field("id", "string", "Facility UUID", { required: true, unique: true }),
    field("name", "string", "Facility name", { required: true }),
    field("sport", "string", "Sport code in the municipality's catalogue", {
      required: true,
      pattern: sportCode,
    }),
    field("cnid_class", "string", "CNID group of conventional sports spaces", {
      required: true,
    }),
    field("cnid_type", "string", "CNID sports space type", { required: true }),
    field("schema_type", "string", "schema.org type", { required: true }),
    field("address", "string", "Postal address", { required: true }),
    field("latitude", "number", "WGS 84 latitude, empty when unknown", {
      minimum: -90,
      maximum: 90,
    }),
    field("longitude", "number", "WGS 84 longitude, empty when unknown", {
      minimum: -180,
      maximum: 180,
    }),
    field("accessible", "boolean", "Step-free access", { required: true }),
    field("status", "string", "Operational status", {
      required: true,
      enum: statuses,
    }),
    field("slot_minutes", "integer", "Duration of one reservable slot", {
      required: true,
    }),
    field("price_eur", "number", "Indicative price per slot in EUR", {
      required: true,
      minimum: 0,
    }),
    field("courts", "integer", "Active courts or spaces", {
      required: true,
      minimum: 0,
    }),
    field("url", "string", "Public page of the facility", { required: true }),
  ],
  primaryKey: "id",
  missingValues: [""],
};
export const openDataSchemas = {
  "facilities.schema.json": facilitiesJson,
  "facilities.geojson.schema.json": facilitiesGeoJson,
  "facilities.tableschema.json": facilitiesTable,
} as const;
export type OpenDataSchemaName = keyof typeof openDataSchemas;
