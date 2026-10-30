// SPDX-License-Identifier: AGPL-3.0-or-later
import { Publication } from "./publication";
/** schema.org JSON-LD: an ItemList of sports locations of one municipality. */
export function facilitiesJsonLd(publication: Publication) {
  const { municipality, facilities } = publication.data;
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "@id": publication.file("facilities.json"),
    name: `${municipality.name}: instalacións deportivas`,
    license: publication.license.url,
    publisher: { "@type": "GovernmentOrganization", name: municipality.name },
    numberOfItems: facilities.length,
    itemListElement: facilities.map((facility, index) => {
      const { classification } = facility;
      return {
        "@type": "ListItem",
        position: index + 1,
        item: {
          "@type": classification.schemaType,
          "@id": publication.facilityPage(facility.id),
          identifier: facility.id,
          name: facility.name,
          description: facility.description,
          url: publication.facilityPage(facility.id),
          publicAccess: true,
          isAccessibleForFree: facility.priceCents === 0,
          address: {
            "@type": "PostalAddress",
            streetAddress: facility.address,
            addressLocality: municipality.name,
            addressCountry: "ES",
          },
          ...(facility.latitude !== null && facility.longitude !== null
            ? {
                geo: {
                  "@type": "GeoCoordinates",
                  latitude: facility.latitude,
                  longitude: facility.longitude,
                },
              }
            : {}),
          amenityFeature: [
            {
              "@type": "LocationFeatureSpecification",
              name: "Step-free access",
              value: facility.accessible,
            },
          ],
          additionalProperty: [
            property("sport", facility.sport),
            property("cnidClass", classification.cnidClass),
            property("cnidType", classification.cnidType),
            property("status", facility.status),
            property("slotMinutes", facility.slotMinutes),
            property("priceEur", facility.priceCents / 100),
            property("courts", facility.courts),
          ],
        },
      };
    }),
  };
}
function property(name: string, value: string | number) {
  return { "@type": "PropertyValue", name, value };
}
