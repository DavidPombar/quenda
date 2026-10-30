// SPDX-License-Identifier: AGPL-3.0-or-later
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_LENGTH = 200;
/**
 * The path counted in analytics: no query string or fragment (they can carry tokens such as the
 * unsubscribe link's) and identifiers replaced by `:id`, so no reservation or person shows up.
 * Null when it is not a path of the app.
 */
export function pagePath(raw: string): string | null {
  const path = raw.split(/[?#]/)[0] ?? "";
  if (!path.startsWith("/") || path.startsWith("//")) return null;
  const clean = path
    .split("/")
    .map((segment) => (UUID.test(segment) ? ":id" : segment))
    .join("/");
  if (clean.length > MAX_LENGTH || !/^[\w\-/.:%]*$/.test(clean)) return null;
  return clean;
}
