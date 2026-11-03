// SPDX-License-Identifier: AGPL-3.0-or-later
import { apiClient } from "@/client/api-client";
import type { Dependant } from "@/types/models";
export const dependantsRepository = {
  list: () => apiClient.request<Dependant[]>("citizen/dependants"),
  add: (body: {
    id: string;
    firstName: string;
    birthYear: number;
    declared: boolean;
    declarationVersion: string;
  }) =>
    apiClient.request<Dependant>("citizen/dependants", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  update: (args: { id: string; firstName: string; birthYear: number }) =>
    apiClient.request<Dependant>(`citizen/dependants/${args.id}`, {
      method: "PATCH",
      body: JSON.stringify({
        firstName: args.firstName,
        birthYear: args.birthYear,
      }),
    }),
  remove: (id: string) =>
    apiClient.request<void>(`citizen/dependants/${id}`, { method: "DELETE" }),
};
