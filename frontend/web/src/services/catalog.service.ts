// SPDX-License-Identifier: AGPL-3.0-or-later
import type { CatalogFilters } from "@/types/models";
const SPORT_CODE = /^[a-z0-9-]{2,40}$/;
export const CITIZEN_APP_BASE = "/app";
/** URL search params ↔ filters, so a search can be shared or bookmarked. */
export function filtersFrom(params: URLSearchParams): CatalogFilters {
  const sport = params.get("sport") ?? "";
  return {
    q: params.get("q") ?? "",
    sport: SPORT_CODE.test(sport) ? sport : "",
    accessible: params.get("accessible") === "1",
    municipalities: (params.get("municipality") ?? "")
      .split(",")
      .filter((value) => /^[a-z0-9-]{1,64}$/.test(value)),
  };
}
export function paramsFrom(filters: CatalogFilters) {
  const params = new URLSearchParams();
  if (filters.q.trim()) params.set("q", filters.q);
  if (filters.sport) params.set("sport", filters.sport);
  if (filters.accessible) params.set("accessible", "1");
  if (filters.municipalities.length)
    params.set("municipality", filters.municipalities.join(","));
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
  return params.toString();
}
/** Facility page in the citizen app, inside its municipality. */
export function bookingUrl(slug: string, id: string) {
  return `${CITIZEN_APP_BASE}/${slug}/instalacions/${id}`;
}
