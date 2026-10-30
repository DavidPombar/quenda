// SPDX-License-Identifier: AGPL-3.0-or-later
import type { AnalyticsApp } from "./analytics-config";
export interface PageView {
  app: AnalyticsApp;
  hostname: string;
  /** Path without query string or fragment, identifiers replaced by placeholders. */
  path: string;
  language: string;
  screen: string;
  /** Municipality slug, so each council's views can be read apart; none for the website. */
  tag: string | null;
  /** Fixed event name, or null for a page view. */
  event: string | null;
  /** The visitor's browser and address, so Umami can count unique visitors (hashed daily). */
  userAgent: string;
  ip: string;
}
/** Hands page views and events to the deployment's own Umami; nothing goes to a third party. */
export abstract class AnalyticsForwarder {
  /** Throws when Umami could not be reached or refused the view. */
  abstract send(view: PageView): Promise<void>;
}
