// SPDX-License-Identifier: AGPL-3.0-or-later
import { useListActivitiesQuery } from "@/queries/activities/list-activities.query";
export function useFacilityActivitiesController(p: {
  slug: string;
  facilityId: string;
}) {
  const query = useListActivitiesQuery(p.slug, {
    sport: "",
    age: null,
    open: false,
    facilityId: p.facilityId,
    page: 1,
  });
  return {
    activities: query.data?.items ?? [],
    total: query.data?.total ?? 0,
  };
}
