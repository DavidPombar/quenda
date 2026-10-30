// SPDX-License-Identifier: AGPL-3.0-or-later
import { apiClient } from "@/client/api-client";
import type { AuthMethods, Locale, Session } from "@/types/models";
export const authRepository = {
  methods: () => apiClient.request<AuthMethods>("public/auth/methods"),
  /** Always accepted: the answer never says whether the address has an account. */
  requestEmailCode: (body: {
    slug: string;
    email: string;
    legalVersion: string;
    locale: Locale;
  }) =>
    apiClient.request<void>("public/auth/email/codes", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  verifyEmailCode: (body: { slug: string; email: string; code: string }) =>
    apiClient.request<Session>("public/auth/email/sessions", {
      method: "POST",
      body: JSON.stringify(body),
    }),
};
