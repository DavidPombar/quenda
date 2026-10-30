// SPDX-License-Identifier: AGPL-3.0-or-later
import { apiClient } from "@/client/api-client";
import type {
  AuthMethods,
  OperatorSession,
  Session,
  SignInStep,
} from "@/types/models";
const post = <T>(path: string, body: unknown) =>
  apiClient.request<T>(path, { method: "POST", body: JSON.stringify(body) });
export const authRepository = {
  methods: () => apiClient.request<AuthMethods>("public/auth/methods"),
  /** First step for municipal staff (slug) or, without one, the deployment's operators. */
  password: (args: { slug?: string; login: string; password: string }) =>
    post<SignInStep>(
      args.slug
        ? "public/auth/staff/password"
        : "public/auth/operator/password",
      args,
    ),
  changePassword: (args: { ticket: string; newPassword: string }) =>
    post<SignInStep>("public/auth/local/password-change", args),
  totp: (args: { ticket: string; code: string }) =>
    post<Session | OperatorSession>("public/auth/local/totp", args),
};
