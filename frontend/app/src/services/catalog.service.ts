// SPDX-License-Identifier: AGPL-3.0-or-later
import type {
  CatalogFilters,
  FacilityFilters,
  Locale,
  Localized,
} from "@/types/models";
/** Facilities per page in both catalogues (#26). */
export const PAGE_SIZE = 12;
const SPORT_CODE = /^[a-z0-9-]{2,40}$/;
function sportFrom(params: URLSearchParams) {
  const sport = params.get("sport") ?? "";
  return SPORT_CODE.test(sport) ? sport : "";
}
function pageFrom(params: URLSearchParams) {
  const page = Number(params.get("paxina"));
  return Number.isInteger(page) && page >= 1 && page <= 10000 ? page : 1;
}
/** Text in the person's language; an empty Spanish text shows the Galician one. */
export function localized(text: Localized, locale: Locale) {
  return (locale === "es" && text.es) || text.gl;
}
/** URL search params ↔ filters, so a search can be shared or bookmarked. */
export function filtersFrom(params: URLSearchParams): CatalogFilters {
  return {
    q: params.get("q") ?? "",
    sport: sportFrom(params),
    accessible: params.get("accessible") === "1",
    municipalities: (params.get("municipality") ?? "")
      .split(",")
      .filter((value) => /^[a-z0-9-]{1,64}$/.test(value)),
    page: pageFrom(params),
  };
}
export function paramsFrom(filters: CatalogFilters) {
  const params = new URLSearchParams();
  if (filters.q.trim()) params.set("q", filters.q);
  if (filters.sport) params.set("sport", filters.sport);
  if (filters.accessible) params.set("accessible", "1");
  if (filters.municipalities.length)
    params.set("municipality", filters.municipalities.join(","));
  if (filters.page > 1) params.set("paxina", String(filters.page));
  return params;
}
/** Query string for GET /v2/public/catalog. */
export function catalogQuery(filters: CatalogFilters) {
  const params = new URLSearchParams();
  if (filters.q.trim()) params.set("q", filters.q.trim().slice(0, 80));
  if (filters.sport) params.set("sport", filters.sport);
  if (filters.accessible) params.set("accessible", "true");
  if (filters.municipalities.length)
    params.set("municipality", filters.municipalities.join(","));
  params.set("page", String(filters.page));
  params.set("pageSize", String(PAGE_SIZE));
  return params.toString();
}
/** Filters of one municipality's catalogue, read from its URL. */
export function facilityFiltersFrom(params: URLSearchParams): FacilityFilters {
  return {
    q: params.get("q") ?? "",
    sport: sportFrom(params),
    accessible: params.get("accesible") === "1",
    hideClosed: params.get("ocultarPechadas") === "1",
    page: pageFrom(params),
  };
}
export function facilityParamsFrom(filters: FacilityFilters) {
  const params = new URLSearchParams();
  if (filters.q.trim()) params.set("q", filters.q);
  if (filters.sport) params.set("sport", filters.sport);
  if (filters.accessible) params.set("accesible", "1");
  if (filters.hideClosed) params.set("ocultarPechadas", "1");
  if (filters.page > 1) params.set("paxina", String(filters.page));
  return params;
}
/** Query string for GET /v2/public/facilities. */
export function facilitiesQuery(slug: string, filters: FacilityFilters) {
  const params = new URLSearchParams({ slug });
  if (filters.q.trim()) params.set("q", filters.q.trim().slice(0, 80));
  if (filters.sport) params.set("sport", filters.sport);
  if (filters.accessible) params.set("accessible", "true");
  if (filters.hideClosed) params.set("hideClosed", "true");
  params.set("page", String(filters.page));
  params.set("pageSize", String(PAGE_SIZE));
  return params.toString();
}
/**
 * Page numbers to offer: always the first and last, the current one and its neighbours, with
 * `null` standing for the gaps.
 */
export function pageNumbers(current: number, pages: number) {
  const shown = [...new Set([1, current - 1, current, current + 1, pages])]
    .filter((page) => page >= 1 && page <= pages)
    .sort((a, b) => a - b);
  return shown.flatMap((page, index) =>
    index > 0 && page - shown[index - 1] > 1 ? [null, page] : [page],
  );
}
