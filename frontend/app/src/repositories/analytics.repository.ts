// SPDX-License-Identifier: AGPL-3.0-or-later
import { apiClient } from "@/client/api-client";
export interface PageView {
  slug: string;
  path: string;
  language: string;
  screen: string;
}
/** Page views go to our own API, which passes them to the council's Umami (#25). */
export const analyticsRepository = {
  pageView: (view: PageView) =>
    apiClient.request<void>("public/analytics/pageview", {
      method: "POST",
      body: JSON.stringify(view),
      keepalive: true,
    }),
};
