// SPDX-License-Identifier: AGPL-3.0-or-later
import { apiClient } from "@/client/api-client";
import type { Facility } from "@/types/models";
export const facilitiesRepository = {
  list: (slug: string) =>
    apiClient.request<Facility[]>(
      `public/facilities?slug=${encodeURIComponent(slug)}`,
    ),
  save: (args: { facility: Facility; isNew: boolean }) =>
    apiClient.request<Facility | void>(
      `manager/facilities${args.isNew ? "" : `/${args.facility.id}`}`,
      {
        method: args.isNew ? "POST" : "PATCH",
        body: JSON.stringify({
          ...(args.isNew ? { id: args.facility.id } : {}),
          ...editable(args.facility),
        }),
      },
    ),
};
/**
 * Only the fields the API accepts: the public listing also returns read-only data such as the
 * courts, and the API rejects unknown properties.
 */
function editable(facility: Facility) {
  return {
    name: facility.name,
    sport: facility.sport,
    address: facility.address,
    description: facility.description,
    accessible: facility.accessible,
    status: facility.status,
    slotMinutes: facility.slotMinutes,
    priceCents: facility.priceCents,
    openingCalendar: facility.openingCalendar,
    rules: facility.rules,
  };
}
