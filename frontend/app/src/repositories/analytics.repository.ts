// SPDX-License-Identifier: AGPL-3.0-or-later
import { apiClient } from "@/client/api-client";
import type { AnalyticsEvent } from "@/types/models";
export interface AnalyticsHit {
  slug: string;
  path: string;
  event?: AnalyticsEvent;
  language: string;
  screen: string;
}
/**
 * Views and events go to our own API, which passes them to the deployment's Umami (#25, #57).
 * Browsers that ask not to be tracked (Do Not Track, Global Privacy Control) send nothing.
 */
export const analyticsRepository = {
  optedOut: () =>
    navigator.doNotTrack === "1" ||
    (navigator as Navigator & { globalPrivacyControl?: boolean })
      .globalPrivacyControl === true,
  hit: (hit: AnalyticsHit) =>
    apiClient.request<void>("public/analytics/pageview", {
      method: "POST",
      body: JSON.stringify({ app: "app", ...hit }),
      keepalive: true,
    }),
};
