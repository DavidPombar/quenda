// SPDX-License-Identifier: AGPL-3.0-or-later
import { apiClient } from "@/client/api-client";
import type { OperatorSession } from "@/types/models";
export const operatorSessionsRepository = {
  get: () =>
    apiClient
      .request<{ session: OperatorSession | null }>("public/operator-session")
      .then((value) => value.session),
  create: () =>
    apiClient.request<OperatorSession>("public/operator-sessions", {
      method: "POST",
      body: "{}",
    }),
  remove: () =>
    apiClient.request<void>("public/operator-session", { method: "DELETE" }),
};
