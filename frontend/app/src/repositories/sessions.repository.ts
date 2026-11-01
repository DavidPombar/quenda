// SPDX-License-Identifier: AGPL-3.0-or-later
import { apiClient } from "@/client/api-client";
import type { Session } from "@/types/models";
export const sessionsRepository = {
  get: () =>
    apiClient
      .request<{
        session: Session | null;
        expiresAt: string | null;
      }>("public/session")
      .then((value) =>
        value.session ? { ...value.session, expiresAt: value.expiresAt } : null,
      ),
  extend: () =>
    apiClient.request<{ expiresAt: string }>("public/session/extension", {
      method: "POST",
      body: "{}",
    }),
  create: (body: { slug: string; role: "citizen"; legalVersion?: string }) =>
    apiClient.request<Session>("public/sessions", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  remove: () => apiClient.request<void>("public/session", { method: "DELETE" }),
};
