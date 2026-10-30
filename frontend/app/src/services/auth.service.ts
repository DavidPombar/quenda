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
const EMAIL_CODE_ERRORS: Record<string, TextKey> = {
  code_invalid: "emailCodeInvalid",
  code_expired: "emailCodeExpired",
  consent_required: "authErrorConsent",
  validation: "emailInvalid",
};
/** Message for a failed email-code request or check; never says whether an account exists. */
export function emailCodeErrorKey(code: string | undefined): TextKey {
  return code && Object.hasOwn(EMAIL_CODE_ERRORS, code)
    ? EMAIL_CODE_ERRORS[code]
    : "authErrorGeneric";
}
export function withProvider(template: string, label: string): string {
  return template.replace("{provider}", label);
}
