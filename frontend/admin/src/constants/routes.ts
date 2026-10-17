// SPDX-License-Identifier: AGPL-3.0-or-later
export const ADMIN_BASE_PATH = "/admin";
export const WEBSITE_URL = "/";
export const CITIZEN_APP_URL = "/app/";
export const ROUTES = {
  home: "/",
  shell: "/:slug",
  management: "xestion",
} as const;
export function routeFor(slug: string, child: string) {
  return `/${slug}/${child}`;
}
