// SPDX-License-Identifier: AGPL-3.0-or-later
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useListCatalogQuery } from "@/queries/catalog/list-catalog.query";
import { useListMunicipalitiesQuery } from "@/queries/municipalities/list-municipalities.query";
import { useListSportsQuery } from "@/queries/catalog/list-sports.query";
import {
  PAGE_SIZE,
  bookingUrl,
  filtersFrom,
  localized,
  paramsFrom,
} from "@/services/catalog.service";
import { useWebAnalytics } from "@/queries/analytics/web-analytics.query";
import { copy, type Locale } from "@/services/i18n.service";
import type { CatalogFilters } from "@/types/models";
export function useSearchController() {
  const [locale, setLocale] = useState<Locale>(() =>
    localStorage.getItem("quenda.locale") === "es" ? "es" : "gl",
  );
  const analytics = useWebAnalytics(locale);
  useEffect(() => {
    document.documentElement.lang = locale;
    document.title = `${copy[locale].searchTitle} · Quenda`;
  }, [locale]);
  function selectLocale(value: Locale) {
    localStorage.setItem("quenda.locale", value);
    setLocale(value);
  }
  const [params, setParams] = useSearchParams();
  const filters = filtersFrom(params);
  const catalog = useListCatalogQuery(filters);
  const municipalities = useListMunicipalitiesQuery();
  const sports = useListSportsQuery(filters.municipalities);
  function update(patch: Partial<CatalogFilters>) {
    analytics.track("search");
    // A new filter starts again from the first page.
    setParams(paramsFrom({ ...filters, page: 1, ...patch }), {
      replace: true,
    });
  }
  function toggleMunicipality(slug: string) {
    update({
      municipalities: filters.municipalities.includes(slug)
        ? filters.municipalities.filter((value) => value !== slug)
        : [...filters.municipalities, slug],
    });
  }
  const t = copy[locale];
  const count = catalog.data?.total ?? 0;
  const pages = Math.max(1, Math.ceil(count / PAGE_SIZE));
  const pageHref = (page: number) =>
    `?${paramsFrom({ ...filters, page }).toString()}`;
  return {
    t,
    locale,
    selectLocale,
    filters,
    update,
    toggleMunicipality,
    clear: () => setParams(new URLSearchParams(), { replace: true }),
    hasFilters: params.toString() !== "",
    catalog,
    municipalities,
    countLabel: `${count} ${count === 1 ? t.searchOne : t.searchResults}`,
    sports: (sports.data ?? []).map((sport) => ({
      code: sport.code,
      label: localized(sport.name, locale),
    })),
    sportLabel: (name: { gl: string; es: string }) => localized(name, locale),
    pages,
    pageLabel: t.searchPage
      .replace("{page}", String(filters.page))
      .replace("{pages}", String(pages)),
    previousHref: filters.page > 1 ? pageHref(filters.page - 1) : null,
    nextHref: filters.page < pages ? pageHref(filters.page + 1) : null,
    bookingUrl,
  };
}
