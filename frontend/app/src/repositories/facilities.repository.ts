// SPDX-License-Identifier: AGPL-3.0-or-later
import { apiClient } from "@/client/api-client";
import { facilitiesQuery } from "@/services/catalog.service";
import type {
  Availability,
  FacilityFilters,
  FacilityPage,
  FacilityWithSchedule,
  MapSettings,
  SportInfo,
} from "@/types/models";
export const facilitiesRepository = {
  list: (slug: string, filters: FacilityFilters) =>
    apiClient.request<FacilityPage>(
      `public/facilities?${facilitiesQuery(slug, filters)}`,
    ),
  get: (args: { slug: string; id: string }) =>
    apiClient.request<FacilityWithSchedule>(
      `public/facilities/${encodeURIComponent(args.id)}?${new URLSearchParams({ slug: args.slug })}`,
    ),
  availability: (args: { slug: string; id: string; date: string }) =>
    apiClient.request<Availability>(
      `public/availability/${args.id}?${new URLSearchParams({ slug: args.slug, date: args.date })}`,
    ),
  /** Visible sports of the given municipalities, or of every one when empty. */
  sports: (municipalities: readonly string[]) =>
    apiClient.request<SportInfo[]>(
      `public/sports${municipalities.length ? `?${new URLSearchParams({ municipality: municipalities.join(",") })}` : ""}`,
    ),
  map: () => apiClient.request<MapSettings>("public/map"),
};
