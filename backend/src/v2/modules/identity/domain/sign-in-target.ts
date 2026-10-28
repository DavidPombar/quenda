// SPDX-License-Identifier: AGPL-3.0-or-later
/**
 * Where the citizen app lands after signing in. Only paths inside the citizen app are accepted, so
 * the sign-in endpoints can never be used as an open redirect.
 */
export function citizenHome(slug: string) {
  return `/app/${slug}/instalacions`;
}
export function safeReturnTo(slug: string, returnTo: string | undefined) {
  if (
    returnTo === undefined ||
    returnTo.length > 512 ||
    !returnTo.startsWith("/app/") ||
    returnTo.includes("..") ||
    // Backslashes, whitespace and control characters can be reinterpreted by browsers.
    /[\\\s\u0000-\u001f\u007f]/.test(returnTo)
  )
    return citizenHome(slug);
  return returnTo;
}
/** Canonical form for comparison: no separators, upper case, without an eIDAS "ES/ES/" prefix. */
export function normaliseNif(value: string) {
  return value
    .toUpperCase()
    .replace(/^[A-Z]{2}\/[A-Z]{2}\//, "")
    .replace(/[\s.-]/g, "");
}
