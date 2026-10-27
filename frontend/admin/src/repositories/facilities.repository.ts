// SPDX-License-Identifier: AGPL-3.0-or-later
import { apiClient } from "@/client/api-client";
import type { Facility, FacilityImpact } from "@/types/models";
export const facilitiesRepository = {
  list: (slug: string) =>
    apiClient.request<Facility[]>(
      `public/facilities?slug=${encodeURIComponent(slug)}`,
    ),
  impact: (id: string) =>
    apiClient.request<FacilityImpact>(`manager/facilities/${id}/impact`),
  save: (args: {
    facility: Facility;
    isNew: boolean;
    /** Cancels upcoming bookings with this reason when closing. */
    closureReason?: string;
  }) =>
    apiClient.request<Facility | void>(
      `manager/facilities${args.isNew ? "" : `/${args.facility.id}`}`,
      {
        method: args.isNew ? "POST" : "PATCH",
        body: JSON.stringify(
          args.isNew
            ? args.facility
            : {
                ...(({ id: _id, ...fields }) => fields)(args.facility),
                closureReason: args.closureReason,
              },
        ),
      },
    ),
};
