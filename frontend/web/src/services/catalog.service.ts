// SPDX-License-Identifier: AGPL-3.0-or-later
import type { CatalogFilters, Localized } from "@/types/models";
export const CITIZEN_APP_BASE = "/app";
/** Facilities per page, as in the citizen app (#26). */
export const PAGE_SIZE = 12;
/** Text in the visitor's language; an empty Spanish text shows the Galician one. */
export function localized(text: Localized, locale: "gl" | "es") {
  return (locale === "es" && text.es) || text.gl;
}
/** URL search params ↔ filters, so a search can be shared or bookmarked. */
export function filtersFrom(params: URLSearchParams): CatalogFilters {
  const sport = params.get("sport") ?? "";
  const page = Number(params.get("paxina"));
  return {
    q: params.get("q") ?? "",
    sport: /^[a-z0-9-]{2,40}$/.test(sport) ? sport : "",
    accessible: params.get("accessible") === "1",
    municipalities: (params.get("municipality") ?? "")
      .split(",")
      .filter((value) => /^[a-z0-9-]{1,64}$/.test(value)),
    page: Number.isInteger(page) && page >= 1 && page <= 10000 ? page : 1,
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
/** Facility page in the citizen app, inside its municipality. */
export function bookingUrl(slug: string, id: string) {
  return `${CITIZEN_APP_BASE}/${slug}/instalacions/${id}`;
}
