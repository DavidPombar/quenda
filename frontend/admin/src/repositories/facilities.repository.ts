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
        body: JSON.stringify(
          args.isNew
            ? args.facility
            : (({ id: _id, ...fields }) => fields)(args.facility),
        ),
      },
    ),
};
