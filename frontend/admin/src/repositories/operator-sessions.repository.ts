// SPDX-License-Identifier: AGPL-3.0-or-later
import { apiClient } from "@/client/api-client";
import type { OperatorSession } from "@/types/models";
export const operatorSessionsRepository = {
  get: () =>
    apiClient
      .request<{
        session: OperatorSession | null;
        expiresAt: string | null;
      }>("public/operator-session")
      .then((value) =>
        value.session ? { ...value.session, expiresAt: value.expiresAt } : null,
      ),
  extend: () =>
    apiClient.request<{ expiresAt: string }>(
      "public/operator-session/extension",
      { method: "POST", body: "{}" },
    ),
  create: () =>
    apiClient.request<OperatorSession>("public/operator-sessions", {
      method: "POST",
      body: "{}",
    }),
  remove: () =>
    apiClient.request<void>("public/operator-session", { method: "DELETE" }),
};
