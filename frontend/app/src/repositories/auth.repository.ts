// SPDX-License-Identifier: AGPL-3.0-or-later
import { apiClient } from "@/client/api-client";
import type { AuthMethods } from "@/types/models";
export const authRepository = {
  methods: () => apiClient.request<AuthMethods>("public/auth/methods"),
};
