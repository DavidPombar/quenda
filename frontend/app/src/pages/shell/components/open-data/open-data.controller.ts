// SPDX-License-Identifier: AGPL-3.0-or-later
import { useOutletContext } from "react-router-dom";
import type { AppContext } from "@/types/app-context";
import type { Municipality } from "@/types/models";
const LICENSES: Record<
  Municipality["dataLicense"],
  { name: string; url: string }
> = {
  "CC-BY-4.0": {
    name: "Creative Commons Attribution 4.0 International (CC BY 4.0)",
    url: "https://creativecommons.org/licenses/by/4.0/",
  },
  "CC-BY-SA-4.0": {
    name: "Creative Commons Attribution-ShareAlike 4.0 International (CC BY-SA 4.0)",
    url: "https://creativecommons.org/licenses/by-sa/4.0/",
  },
  "CC0-1.0": {
    name: "Creative Commons Zero 1.0 Universal (CC0 1.0)",
    url: "https://creativecommons.org/publicdomain/zero/1.0/",
  },
  "ODbL-1.0": {
    name: "Open Data Commons Open Database License 1.0 (ODbL)",
    url: "https://opendatacommons.org/licenses/odbl/1-0/",
  },
};
const BASE = "/v2/public/open-data";
export function useOpenDataController() {
  const context = useOutletContext<AppContext>();
  const slug = encodeURIComponent(context.municipality.slug);
  const file = (name: string) => `${BASE}/${name}?slug=${slug}`;
  const schema = (name: string) => `${BASE}/schemas/${name}`;
  return {
    t: context.t,
    municipality: context.municipality,
    license: LICENSES[context.municipality.dataLicense],
    facilities: [
      {
        label: "JSON-LD (schema.org)",
        type: "application/ld+json",
        href: file("facilities.json"),
        schema: schema("facilities.schema.json"),
      },
      {
        label: "CSV",
        type: "text/csv",
        href: file("facilities.csv"),
        schema: schema("facilities.tableschema.json"),
      },
      {
        label: "GeoJSON",
        type: "application/geo+json",
        href: file("facilities.geojson"),
        schema: schema("facilities.geojson.schema.json"),
      },
    ],
    catalogs: [
      {
        label: "RDF/XML",
        type: "application/rdf+xml",
        href: file("catalog.rdf"),
      },
      {
        label: "JSON-LD",
        type: "application/ld+json",
        href: file("catalog.jsonld"),
      },
    ],
    apiDocs: "/api/docs",
  };
}
