// SPDX-License-Identifier: AGPL-3.0-or-later
export const APP_BASE_PATH = "/app";
export const WEBSITE_URL = "/";
export const ROUTES = {
  home: "/",
  shell: "/:slug",
  catalog: "instalacions",
  detail: "instalacions/:id",
  bookings: "reservas",
  account: "conta",
  unsubscribe: "baixa",
} as const;
export function routeFor(slug: string, child: string) {
  return `/${slug}/${child}`;
}
