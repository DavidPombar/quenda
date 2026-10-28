// SPDX-License-Identifier: AGPL-3.0-or-later
import type { TextKey } from "@/services/i18n.service";
export const AUTH_ERROR_PARAM = "authError";
// The eID login is a full-page navigation: the backend answers with redirects
// to the identity provider and back into the application.
export function oidcStartUrl(input: {
  slug: string;
  legalVersion: string;
  returnTo: string;
}): string {
  const query = new URLSearchParams({
    slug: input.slug,
    legalVersion: input.legalVersion,
    returnTo: input.returnTo,
  });
  return `/v2/public/auth/oidc/start?${query.toString()}`;
}
const AUTH_ERRORS: Record<string, TextKey> = {
  consent_required: "authErrorConsent",
  login_expired: "authErrorExpired",
  login_rejected: "authErrorRejected",
  oidc_unavailable: "authErrorUnavailable",
};
export function authErrorMessageKey(code: string): TextKey {
  return Object.hasOwn(AUTH_ERRORS, code)
    ? AUTH_ERRORS[code]
    : "authErrorGeneric";
}
export function withProvider(template: string, label: string): string {
  return template.replace("{provider}", label);
}
