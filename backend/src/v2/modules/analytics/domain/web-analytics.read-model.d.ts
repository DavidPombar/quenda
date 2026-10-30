// SPDX-License-Identifier: AGPL-3.0-or-later
/** Totals as Umami returns them for a site and range (optionally one council's tag). */
export interface UmamiTotals {
  pageviews: number;
  visitors: number;
  visits: number;
  bounces: number;
  /** Seconds spent across all visits. */
  totaltime: number;
}
export interface Ranked {
  value: string;
  count: number;
}
export interface SiteReport {
  visitors: number;
  visits: number;
  pageviews: number;
  /** Visits with a single page view, in percent; null without visits. */
  bounceRate: number | null;
  /** Average visit length in seconds; null without visits. */
  averageVisitSeconds: number | null;
  pages: Ranked[];
  referrers: Ranked[];
  devices: Ranked[];
  languages: Ranked[];
  events: Ranked[];
}
export interface MunicipalityVisits {
  slug: string;
  name: string;
  visitors: number;
  visits: number;
  pageviews: number;
}
export interface WebAnalytics {
  /** False when the deployment cannot read its Umami; nothing else is filled then. */
  available: boolean;
  /** False when the council has not switched analytics on (managers only). */
  enabled: boolean;
  from: string;
  to: string;
  app: SiteReport | null;
  /** Public website; operator only. */
  web: SiteReport | null;
  /** Per council with analytics on; operator only. */
  municipalities: MunicipalityVisits[];
}
