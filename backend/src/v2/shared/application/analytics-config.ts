// SPDX-License-Identifier: AGPL-3.0-or-later
/** The two sites the deployment's Umami counts (#57): the public website and the citizen app. */
export type AnalyticsApp = "app" | "web";
export interface UmamiAccess {
  url: string;
  websites: Record<AnalyticsApp, string | null>;
  /** Read-only Umami user for the dashboards; null when only collection is configured. */
  reader: { username: string; password: string } | null;
}
/** Deployment configuration of web analytics; nothing is sent or shown without it. */
export abstract class AnalyticsConfig {
  abstract umami(): UmamiAccess | null;
  /** Time zone of the operator's dashboard ranges. */
  abstract deploymentTimezone(): string;
  /** Whether page views of that app are sent to Umami. */
  collects(app: AnalyticsApp) {
    return !!this.umami()?.websites[app];
  }
  /** Whether the dashboards can read Umami's statistics. */
  reads() {
    return !!this.umami()?.reader && this.collects("app");
  }
}
