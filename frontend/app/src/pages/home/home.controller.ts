// SPDX-License-Identifier: AGPL-3.0-or-later
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useListMunicipalitiesQuery } from "@/queries/municipalities/list-municipalities.query";
import { useListCatalogQuery } from "@/queries/catalog/list-catalog.query";
import { useListSportsQuery } from "@/queries/facilities/list-sports.query";
import { ROUTES, routeFor } from "@/constants/routes";
import {
  PAGE_SIZE,
  filtersFrom,
  localized,
  pageNumbers,
  paramsFrom,
} from "@/services/catalog.service";
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
    // A new filter starts again from the first page.
    setParams(paramsFrom({ ...filters, page: 1, ...patch }), {
      replace: true,
    });
  }
  const count = catalog.data?.total ?? 0;
  const pages = Math.max(1, Math.ceil(count / PAGE_SIZE));
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
    sports: (sports.data ?? []).map((sport) => ({
      code: sport.code,
      label: localized(sport.name, locale),
    })),
    sportLabel: (name: { gl: string; es: string }) => localized(name, locale),
    pageNumbers: pageNumbers(filters.page, pages),
    hrefFor: (page: number) =>
      `?${paramsFrom({ ...filters, page }).toString()}`,
    pageLabel: (page: number) =>
      t("pageOf")
        .replace("{page}", String(page))
        .replace("{pages}", String(pages)),
    countLabel: `${count} ${t(count === 1 ? "result" : "spaces")}`,
    detailUrl: (slug: string, id: string) =>
      routeFor(slug, ROUTES.detail.replace(":id", id)),
    catalogUrl: (slug: string) => routeFor(slug, ROUTES.catalog),
  };
}
