// SPDX-License-Identifier: AGPL-3.0-or-later
import { apiClient } from "@/client/api-client";
export interface WebHit {
  path: string;
  event?: "search";
  language: string;
  screen: string;
}
/**
 * The website's views go to our own API, which passes them to the deployment's Umami (#57).
 * Browsers that ask not to be tracked (Do Not Track, Global Privacy Control) send nothing.
 */
export const analyticsRepository = {
  status: () => apiClient.request<{ enabled: boolean }>("public/analytics/web"),
  optedOut: () =>
    navigator.doNotTrack === "1" ||
    (navigator as Navigator & { globalPrivacyControl?: boolean })
      .globalPrivacyControl === true,
  hit: (hit: WebHit) =>
    apiClient.send("public/analytics/pageview", { app: "web", ...hit }),
};
