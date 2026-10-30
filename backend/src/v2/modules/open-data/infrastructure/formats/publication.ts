// SPDX-License-Identifier: AGPL-3.0-or-later
import type { DataLicense } from "../../../../shared/application/municipality-settings";
import type {
  OpenFacilities,
  OpenFacility,
} from "../../domain/open-facility.read-model";
export const licenses: Record<DataLicense, { name: string; url: string }> = {
  "CC-BY-4.0": {
    name: "Creative Commons Attribution 4.0 International",
    url: "https://creativecommons.org/licenses/by/4.0/",
  },
  "CC-BY-SA-4.0": {
    name: "Creative Commons Attribution-ShareAlike 4.0 International",
    url: "https://creativecommons.org/licenses/by-sa/4.0/",
  },
  "CC0-1.0": {
    name: "Creative Commons Zero 1.0 Universal",
    url: "https://creativecommons.org/publicdomain/zero/1.0/",
  },
  "ODbL-1.0": {
    name: "Open Data Commons Open Database License 1.0",
    url: "https://opendatacommons.org/licenses/odbl/1-0/",
  },
};
export const facilityFiles = {
  json: { file: "facilities.json", mediaType: "application/ld+json" },
  csv: { file: "facilities.csv", mediaType: "text/csv" },
  geojson: { file: "facilities.geojson", mediaType: "application/geo+json" },
} as const;
/** Absolute URLs of one municipality's publication, built from the public origin. */
export class Publication {
  constructor(
    readonly origin: string,
    readonly data: OpenFacilities,
  ) {}
  get slug() {
    return encodeURIComponent(this.data.municipality.slug);
  }
  get license() {
    return licenses[this.data.municipality.dataLicense];
  }
  file(name: string) {
    return `${this.origin}/v2/public/open-data/${name}?slug=${this.slug}`;
  }
  schema(name: string) {
    return `${this.origin}/v2/public/open-data/schemas/${name}`;
  }
  page() {
    return `${this.origin}/app/${this.slug}/datos-abertos`;
  }
  facilityPage(id: string) {
    return `${this.origin}/app/${this.slug}/instalacions/${encodeURIComponent(id)}`;
  }
}
/** One flat record per facility, shared by the CSV columns and the GeoJSON properties. */
export function facilityRecord(
  facility: OpenFacility,
  publication: Publication,
) {
  const { classification } = facility;
  return {
    id: facility.id,
    name: facility.name,
    sport: facility.sport,
    cnid_class: classification.cnidClass,
    cnid_type: classification.cnidType,
    schema_type: classification.schemaType,
    address: facility.address,
    latitude: facility.latitude,
    longitude: facility.longitude,
    accessible: facility.accessible,
    status: facility.status,
    slot_minutes: facility.slotMinutes,
    price_eur: facility.priceCents / 100,
    courts: facility.courts,
    url: publication.facilityPage(facility.id),
  };
}
export type FacilityRecord = ReturnType<typeof facilityRecord>;
export const facilityColumns: (keyof FacilityRecord)[] = [
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
];
