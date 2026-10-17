// SPDX-License-Identifier: AGPL-3.0-or-later
import { apiClient } from "@/client/api-client";
import type { Facility, Slot } from "@/types/models";
export const facilitiesRepository = {
  list: (slug: string) =>
    apiClient.request<Facility[]>(
      `public/facilities?slug=${encodeURIComponent(slug)}`,
    ),
  availability: (args: { slug: string; id: string; date: string }) =>
    apiClient.request<Slot[]>(
      `public/availability/${args.id}?${new URLSearchParams({ slug: args.slug, date: args.date })}`,
    ),
};
