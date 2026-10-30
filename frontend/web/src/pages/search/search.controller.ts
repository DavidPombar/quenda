// SPDX-License-Identifier: AGPL-3.0-or-later
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useListCatalogQuery } from "@/queries/catalog/list-catalog.query";
import { useListMunicipalitiesQuery } from "@/queries/municipalities/list-municipalities.query";
import { useListSportsQuery } from "@/queries/sports/list-sports.query";
import {
  bookingUrl,
  filtersFrom,
  paramsFrom,
} from "@/services/catalog.service";
import { copy, type Locale } from "@/services/i18n.service";
import type { CatalogFilters } from "@/types/models";
export function useSearchController() {
  const [locale, setLocale] = useState<Locale>(() =>
    localStorage.getItem("quenda.locale") === "es" ? "es" : "gl",
  );
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
  function update(patch: Partial<CatalogFilters>) {
    setParams(paramsFrom({ ...filters, ...patch }), { replace: true });
  }
  function toggleMunicipality(slug: string) {
    update({
      municipalities: filters.municipalities.includes(slug)
        ? filters.municipalities.filter((value) => value !== slug)
        : [...filters.municipalities, slug],
    });
  }
  const sports = useListSportsQuery(filters.municipalities);
  const t = copy[locale];
  const count = catalog.data?.length ?? 0;
  return {
    t,
    locale,
    selectLocale,
    filters,
    sports: sports.data ?? [],
    update,
    toggleMunicipality,
    clear: () => setParams(new URLSearchParams(), { replace: true }),
    hasFilters: params.toString() !== "",
    catalog,
    municipalities,
    countLabel: `${count} ${count === 1 ? t.searchOne : t.searchResults}`,
    bookingUrl,
  };
}
