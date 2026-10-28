// SPDX-License-Identifier: AGPL-3.0-or-later
import { facilityFiles, Publication } from "./publication";
/**
 * DCAT-AP-ES (NTI-RISP) description of one municipality's open data, built once and serialised
 * as JSON-LD and RDF/XML so both always describe the same datasets and distributions.
 */
interface Text {
  gl: string;
  es: string;
}
interface Distribution {
  uri: string;
  title: Text;
  mediaType: string;
  conformsTo: string;
}
interface Dataset {
  uri: string;
  identifier: string;
  title: Text;
  description: Text;
  keywords: Text[];
  landingPage: string;
  distributions: Distribution[];
}
export interface Catalog {
  uri: string;
  title: Text;
  description: Text;
  homepage: string;
  publisher: { uri: string | null; name: string };
  license: string;
  modified: string;
  datasets: Dataset[];
}
const sportsTheme = "http://datos.gob.es/kos/sector-publico/sector/deporte";
const themeTaxonomy = "http://datos.gob.es/kos/sector-publico/sector/";
export function catalog(publication: Publication): Catalog {
  const { municipality, generatedOn } = publication.data;
  const name = municipality.name;
  return {
    uri: publication.file("catalog.jsonld"),
    title: {
      gl: `Datos abertos de instalacións deportivas: ${name}`,
      es: `Datos abiertos de instalaciones deportivas: ${name}`,
    },
    description: {
      gl: "Catálogo de datos abertos do servizo de reservas de instalacións deportivas municipais.",
      es: "Catálogo de datos abiertos del servicio de reservas de instalaciones deportivas municipales.",
    },
    homepage: publication.page(),
    publisher: {
      uri: municipality.dir3Code
        ? `http://datos.gob.es/recurso/sector-publico/org/Organismo/${municipality.dir3Code}`
        : null,
      name,
    },
    license: publication.license.url,
    modified: generatedOn,
    datasets: [
      {
        uri: `${publication.page()}#instalacions`,
        identifier: `${municipality.slug}-instalacions-deportivas`,
        title: {
          gl: `Instalacións deportivas: ${name}`,
          es: `Instalaciones deportivas: ${name}`,
        },
        description: {
          gl: "Instalacións deportivas municipais con deporte, tipo de espazo do CNID, enderezo, coordenadas, accesibilidade, estado, prezo indicativo e número de pistas. Sen datos persoais.",
          es: "Instalaciones deportivas municipales con deporte, tipo de espacio del CNID, dirección, coordenadas, accesibilidad, estado, precio indicativo y número de pistas. Sin datos personales.",
        },
        keywords: [
          { gl: "deporte", es: "deporte" },
          { gl: "instalacións deportivas", es: "instalaciones deportivas" },
          { gl: "reservas", es: "reservas" },
        ],
        landingPage: publication.page(),
        distributions: [
          {
            uri: publication.file(facilityFiles.json.file),
            title: { gl: "JSON-LD (schema.org)", es: "JSON-LD (schema.org)" },
            mediaType: facilityFiles.json.mediaType,
            conformsTo: publication.schema("facilities.schema.json"),
          },
          {
            uri: publication.file(facilityFiles.csv.file),
            title: { gl: "CSV", es: "CSV" },
            mediaType: facilityFiles.csv.mediaType,
            conformsTo: publication.schema("facilities.tableschema.json"),
          },
          {
            uri: publication.file(facilityFiles.geojson.file),
            title: { gl: "GeoJSON", es: "GeoJSON" },
            mediaType: facilityFiles.geojson.mediaType,
            conformsTo: publication.schema("facilities.geojson.schema.json"),
          },
        ],
      },
    ],
  };
}
const context = {
  dcat: "http://www.w3.org/ns/dcat#",
  dct: "http://purl.org/dc/terms/",
  foaf: "http://xmlns.com/foaf/0.1/",
  rdf: "http://www.w3.org/1999/02/22-rdf-syntax-ns#",
  xsd: "http://www.w3.org/2001/XMLSchema#",
};
const texts = (value: Text) => [
  { "@language": "gl", "@value": value.gl },
  { "@language": "es", "@value": value.es },
];
const ref = (uri: string) => ({ "@id": uri });
export function catalogJsonLd(model: Catalog) {
  return {
    "@context": context,
    "@id": model.uri,
    "@type": "dcat:Catalog",
    "dct:title": texts(model.title),
    "dct:description": texts(model.description),
    "dct:language": ["gl", "es"],
    "dct:modified": { "@type": "xsd:date", "@value": model.modified },
    "dct:license": ref(model.license),
    "foaf:homepage": ref(model.homepage),
    "dct:publisher": {
      ...(model.publisher.uri ? ref(model.publisher.uri) : {}),
      "@type": "foaf:Agent",
      "foaf:name": model.publisher.name,
    },
    "dcat:themeTaxonomy": ref(themeTaxonomy),
    "dcat:dataset": model.datasets.map((dataset) => ({
      "@id": dataset.uri,
      "@type": "dcat:Dataset",
      "dct:identifier": dataset.identifier,
      "dct:title": texts(dataset.title),
      "dct:description": texts(dataset.description),
      "dcat:keyword": dataset.keywords.flatMap(texts),
      "dcat:theme": ref(sportsTheme),
      "dct:language": ["gl", "es"],
      "dct:modified": { "@type": "xsd:date", "@value": model.modified },
      "dct:license": ref(model.license),
      "dcat:landingPage": ref(dataset.landingPage),
      "dcat:distribution": dataset.distributions.map((distribution) => ({
        "@id": distribution.uri,
        "@type": "dcat:Distribution",
        "dct:title": texts(distribution.title),
        "dcat:accessURL": ref(distribution.uri),
        "dcat:downloadURL": ref(distribution.uri),
        "dcat:mediaType": distribution.mediaType,
        "dct:format": {
          "@type": "dct:IMT",
          "rdf:value": distribution.mediaType,
        },
        "dct:license": ref(model.license),
        "dct:conformsTo": ref(distribution.conformsTo),
      })),
    })),
  };
}
const escape = (value: string) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
const literal = (tag: string, value: Text, indent: string) =>
  (["gl", "es"] as const)
    .map(
      (lang) =>
        `${indent}<${tag} xml:lang="${lang}">${escape(value[lang])}</${tag}>`,
    )
    .join("\n");
const resource = (tag: string, uri: string, indent: string) =>
  `${indent}<${tag} rdf:resource="${escape(uri)}"/>`;
export function catalogRdfXml(model: Catalog) {
  const publisher = model.publisher.uri
    ? ` rdf:about="${escape(model.publisher.uri)}"`
    : "";
  const date = (indent: string) =>
    `${indent}<dct:modified rdf:datatype="http://www.w3.org/2001/XMLSchema#date">${model.modified}</dct:modified>`;
  const languages = (indent: string) =>
    ["gl", "es"]
      .map((language) => `${indent}<dct:language>${language}</dct:language>`)
      .join("\n");
  const datasets = model.datasets.map((dataset) =>
    [
      `    <dcat:Dataset rdf:about="${escape(dataset.uri)}">`,
      `      <dct:identifier>${escape(dataset.identifier)}</dct:identifier>`,
      literal("dct:title", dataset.title, "      "),
      literal("dct:description", dataset.description, "      "),
      ...dataset.keywords.map((keyword) =>
        literal("dcat:keyword", keyword, "      "),
      ),
      resource("dcat:theme", sportsTheme, "      "),
      languages("      "),
      date("      "),
      resource("dct:license", model.license, "      "),
      resource("dcat:landingPage", dataset.landingPage, "      "),
      ...dataset.distributions.map((distribution) =>
        [
          "      <dcat:distribution>",
          `        <dcat:Distribution rdf:about="${escape(distribution.uri)}">`,
          literal("dct:title", distribution.title, "          "),
          resource("dcat:accessURL", distribution.uri, "          "),
          resource("dcat:downloadURL", distribution.uri, "          "),
          `          <dcat:mediaType>${escape(distribution.mediaType)}</dcat:mediaType>`,
          "          <dct:format>",
          `            <dct:IMT><rdf:value>${escape(distribution.mediaType)}</rdf:value></dct:IMT>`,
          "          </dct:format>",
          resource("dct:license", model.license, "          "),
          resource("dct:conformsTo", distribution.conformsTo, "          "),
          "        </dcat:Distribution>",
          "      </dcat:distribution>",
        ].join("\n"),
      ),
      "    </dcat:Dataset>",
    ].join("\n"),
  );
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    `<rdf:RDF xmlns:rdf="${context.rdf}"`,
    `  xmlns:dcat="${context.dcat}" xmlns:dct="${context.dct}" xmlns:foaf="${context.foaf}">`,
    `<dcat:Catalog rdf:about="${escape(model.uri)}">`,
    literal("dct:title", model.title, "  "),
    literal("dct:description", model.description, "  "),
    languages("  "),
    date("  "),
    resource("dct:license", model.license, "  "),
    resource("foaf:homepage", model.homepage, "  "),
    "  <dct:publisher>",
    `    <foaf:Agent${publisher}><foaf:name>${escape(model.publisher.name)}</foaf:name></foaf:Agent>`,
    "  </dct:publisher>",
    resource("dcat:themeTaxonomy", themeTaxonomy, "  "),
    "  <dcat:dataset>",
    datasets.join("\n  </dcat:dataset>\n  <dcat:dataset>\n"),
    "  </dcat:dataset>",
    "</dcat:Catalog>",
    "</rdf:RDF>",
    "",
  ].join("\n");
}
