// SPDX-License-Identifier: AGPL-3.0-or-later
import { Publication } from "./publication";
import { csvCell } from "./facilities-csv";
import type { OpenActivities } from "../../domain/open-activity.read-model";
const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];
export const activityColumns = [
  "id",
  "name",
  "sport",
  "facility_id",
  "facility_name",
  "court",
  "weekdays",
  "starts_local",
  "ends_local",
  "starts_on",
  "ends_on",
  "exceptions",
  "rrule",
  "places",
  "enrolled",
  "min_age",
  "max_age",
  "enrolment_opens_on",
  "enrolment_closes_on",
  "price_eur",
  "url",
] as const;
/** RFC 4180 CSV, one row per activity; lists are space-separated within a cell. */
export function activitiesCsv(publication: Publication<OpenActivities>) {
  const rows = publication.data.activities.map((activity) => {
    const record: Record<
      (typeof activityColumns)[number],
      string | number | null
    > = {
      id: activity.id,
      name: activity.name,
      sport: activity.sport,
      facility_id: activity.facilityId,
      facility_name: activity.facilityName,
      court: activity.resourceName,
      weekdays: activity.rule.weekdays.join(" "),
      starts_local: activity.rule.startsLocal,
      ends_local: activity.rule.endsLocal,
      starts_on: activity.rule.startsOn,
      ends_on: activity.rule.endsOn,
      exceptions: activity.rule.exceptions.join(" "),
      rrule: activity.rrule,
      places: activity.places,
      enrolled: activity.enrolled,
      min_age: activity.minAge,
      max_age: activity.maxAge,
      enrolment_opens_on: activity.enrolmentOpensOn,
      enrolment_closes_on: activity.enrolmentClosesOn,
      price_eur:
        activity.priceCents === null ? null : activity.priceCents / 100,
      url: publication.activityPage(activity.id),
    };
    return activityColumns.map((column) => csvCell(record[column]));
  });
  return (
    [activityColumns, ...rows].map((row) => row.join(",")).join("\r\n") + "\r\n"
  );
}
/**
 * schema.org JSON-LD: an ItemList of EventSeries, each with its weekly Schedule, place, capacity,
 * age range and indicative price.
 */
export function activitiesJsonLd(publication: Publication<OpenActivities>) {
  const { municipality, activities } = publication.data;
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "@id": publication.file("activities.json"),
    name: `${municipality.name}: actividades deportivas`,
    license: publication.license.url,
    publisher: { "@type": "GovernmentOrganization", name: municipality.name },
    numberOfItems: activities.length,
    itemListElement: activities.map((activity, index) => ({
      "@type": "ListItem",
      position: index + 1,
      item: {
        "@type": "EventSeries",
        "@id": publication.activityPage(activity.id),
        identifier: activity.id,
        name: activity.name,
        url: publication.activityPage(activity.id),
        sport: activity.sport,
        startDate: activity.rule.startsOn,
        endDate: activity.rule.endsOn,
        eventSchedule: {
          "@type": "Schedule",
          repeatFrequency: "P1W",
          byDay: activity.rule.weekdays.map(
            (day) => `https://schema.org/${DAYS[day - 1]}`,
          ),
          startTime: activity.rule.startsLocal,
          endTime: activity.rule.endsLocal,
          startDate: activity.rule.startsOn,
          endDate: activity.rule.endsOn,
          exceptDate: activity.rule.exceptions,
        },
        location: {
          "@type": "SportsActivityLocation",
          "@id": publication.facilityPage(activity.facilityId),
          name: activity.facilityName,
          address: {
            "@type": "PostalAddress",
            streetAddress: activity.facilityAddress,
            addressLocality: municipality.name,
            addressCountry: "ES",
          },
        },
        maximumAttendeeCapacity: activity.places,
        // schema.org: places left, from the people enrolled (a count, no people).
        remainingAttendeeCapacity: Math.max(
          0,
          activity.places - activity.enrolled,
        ),
        ...(activity.minAge !== null || activity.maxAge !== null
          ? {
              typicalAgeRange: `${activity.minAge ?? 0}-${activity.maxAge ?? ""}`,
            }
          : {}),
        ...(activity.priceCents !== null
          ? {
              offers: {
                "@type": "Offer",
                price: activity.priceCents / 100,
                priceCurrency: "EUR",
                validFrom: activity.enrolmentOpensOn,
                validThrough: activity.enrolmentClosesOn,
              },
            }
          : {}),
      },
    })),
  };
}
