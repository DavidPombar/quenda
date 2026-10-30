// SPDX-License-Identifier: AGPL-3.0-or-later
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useListMunicipalitiesQuery } from "@/queries/municipalities/list-municipalities.query";
import { useListCatalogQuery } from "@/queries/catalog/list-catalog.query";
import { useListSportsQuery } from "@/queries/sports/list-sports.query";
import { ROUTES, routeFor } from "@/constants/routes";
import { filtersFrom, paramsFrom } from "@/services/catalog.service";
import { translate, type TextKey } from "@/services/i18n.service";
import type { CatalogFilters, Locale } from "@/types/models";
/** Shared catalogue across municipalities; each booking still happens inside one (#18). */
export function useHomeController() {
  const [locale, setLocaleState] = useState<Locale>(() =>
    localStorage.getItem("quenda.locale") === "es" ? "es" : "gl",
  );
  function setLocale(next: Locale) {
    localStorage.setItem("quenda.locale", next);
    setLocaleState(next);
  }
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);
  const [params, setParams] = useSearchParams();
  const filters = filtersFrom(params);
  const municipalities = useListMunicipalitiesQuery();
  const catalog = useListCatalogQuery(filters);
  const sports = useListSportsQuery(filters.municipalities);
  function update(patch: Partial<CatalogFilters>) {
    setParams(paramsFrom({ ...filters, ...patch }), { replace: true });
  }
  const count = catalog.data?.length ?? 0;
  const t = (key: TextKey) => translate(locale, key);
  return {
    t,
    locale,
    setLocale,
    filters,
    update,
    toggleMunicipality: (slug: string) =>
      update({
        municipalities: filters.municipalities.includes(slug)
          ? filters.municipalities.filter((value) => value !== slug)
          : [...filters.municipalities, slug],
      }),
    clear: () => setParams(new URLSearchParams(), { replace: true }),
    hasFilters: params.toString() !== "",
    municipalities,
    catalog,
    sports: sports.data ?? [],
    countLabel: `${count} ${t(count === 1 ? "result" : "spaces")}`,
    detailUrl: (slug: string, id: string) =>
      routeFor(slug, ROUTES.detail.replace(":id", id)),
    catalogUrl: (slug: string) => routeFor(slug, ROUTES.catalog),
  };
}
