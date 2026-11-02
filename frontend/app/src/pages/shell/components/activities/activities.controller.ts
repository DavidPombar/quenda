// SPDX-License-Identifier: AGPL-3.0-or-later
import { useOutletContext, useSearchParams } from "react-router-dom";
import { useListActivitiesQuery } from "@/queries/activities/list-activities.query";
import { useListSportsQuery } from "@/queries/facilities/list-sports.query";
import { PAGE_SIZE, localized, pageNumbers } from "@/services/catalog.service";
import {
  activityFiltersFrom,
  activityParamsFrom,
} from "@/services/activity.service";
import type { AppContext } from "@/types/app-context";
import type { ActivityFilters } from "@/types/models";
/** The municipality's activities and sports schools, filtered from the URL (#97). */
export function useActivitiesController() {
  const context = useOutletContext<AppContext>();
  const [params, setParams] = useSearchParams();
  const filters = activityFiltersFrom(params);
  const query = useListActivitiesQuery(context.municipality.slug, filters);
  const sports = useListSportsQuery([context.municipality.slug]);
  function update(changes: Partial<ActivityFilters>) {
    context.track("search");
    setParams(activityParamsFrom({ ...filters, page: 1, ...changes }), {
      replace: true,
    });
  }
  const total = query.data?.total ?? 0;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  return {
    ...context,
    query,
    filters,
    sports: (sports.data ?? []).map((sport) => ({
      code: sport.code,
      label: localized(sport.name, context.locale),
    })),
    setSport: (sport: string) => update({ sport }),
    setAge: (value: string) => {
      const age = Number(value);
      update({
        age:
          value.trim() && Number.isInteger(age) && age >= 0 && age <= 120
            ? age
            : null,
      });
    },
    toggleOpen: () => update({ open: !filters.open }),
    activities: query.data?.items ?? [],
    total,
    page: filters.page,
    pageNumbers: pageNumbers(filters.page, pages),
    hrefFor: (page: number) =>
      `?${activityParamsFrom({ ...filters, page }).toString()}`,
    pageLabel: (page: number) =>
      context
        .t("pageOf")
        .replace("{page}", String(page))
        .replace("{pages}", String(pages)),
  };
}
