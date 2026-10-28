// SPDX-License-Identifier: AGPL-3.0-or-later
import { facilityRecord, Publication } from "./publication";
/** RFC 7946 FeatureCollection; facilities without coordinates have a null geometry. */
export function facilitiesGeoJson(publication: Publication) {
  return {
    type: "FeatureCollection",
    name: `${publication.data.municipality.name}: instalacións deportivas`,
    license: publication.license.url,
    features: publication.data.facilities.map((facility) => ({
      type: "Feature",
      id: facility.id,
      geometry:
        facility.latitude === null || facility.longitude === null
          ? null
          : {
              type: "Point",
              coordinates: [facility.longitude, facility.latitude],
            },
      properties: facilityRecord(facility, publication),
    })),
  };
}
