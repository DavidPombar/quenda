// SPDX-License-Identifier: AGPL-3.0-or-later
import { useEffect, useState } from "react";
import { useOutletContext, useSearchParams } from "react-router-dom";
import { useListFacilitiesQuery } from "@/queries/facilities/list-facilities.query";
import { useListSportsQuery } from "@/queries/facilities/list-sports.query";
import {
  PAGE_SIZE,
  facilityFiltersFrom,
  facilityParamsFrom,
  localized,
  pageNumbers,
} from "@/services/catalog.service";
import type { AppContext } from "@/types/app-context";
import type { FacilityFilters } from "@/types/models";
/** Waiting time before a typed search goes to the server. */
const SEARCH_DELAY = 300;
export function useCatalogController() {
  const context = useOutletContext<AppContext>();
  const [params, setParams] = useSearchParams();
  const filters = facilityFiltersFrom(params);
  const [search, setSearch] = useState(filters.q);
  const query = useListFacilitiesQuery(context.municipality.slug, filters);
  const sports = useListSportsQuery([context.municipality.slug]);
  function update(changes: Partial<FacilityFilters>) {
    context.track("search");
    // Any new filter starts again from the first page.
    setParams(facilityParamsFrom({ ...filters, page: 1, ...changes }), {
      replace: true,
    });
  }
  // Only typing schedules a search; the URL itself is the source of the other filters.
  useEffect(() => {
    if (search === filters.q) return;
    const timer = setTimeout(() => update({ q: search }), SEARCH_DELAY);
    return () => clearTimeout(timer);
  }, [search]);
  const total = query.data?.total ?? 0;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  return {
    ...context,
    query,
    filters,
    search,
    setSearch,
    sports: (sports.data ?? []).map((sport) => ({
      code: sport.code,
      label: localized(sport.name, context.locale),
    })),
    setSport: (sport: string) => update({ sport }),
    toggleAccessible: () => update({ accessible: !filters.accessible }),
    toggleClosed: () => update({ hideClosed: !filters.hideClosed }),
    facilities: query.data?.items ?? [],
    total,
    page: filters.page,
    pageNumbers: pageNumbers(filters.page, pages),
    hrefFor: (page: number) =>
      `?${facilityParamsFrom({ ...filters, page }).toString()}`,
    pageLabel: (page: number) =>
      context
        .t("pageOf")
        .replace("{page}", String(page))
        .replace("{pages}", String(pages)),
  };
}
