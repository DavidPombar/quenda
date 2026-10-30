// SPDX-License-Identifier: AGPL-3.0-or-later
export interface PageView {
  /** Base URL of the council's Umami. */
  url: string;
  websiteId: string;
  hostname: string;
  /** Path without query string or fragment, identifiers replaced by placeholders. */
  path: string;
  language: string;
  screen: string;
  /** The visitor's browser and address, so Umami can count unique visitors (hashed daily). */
  userAgent: string;
  ip: string;
}
/** Hands page views to the council's own Umami; nothing goes to any third party (#25). */
export abstract class AnalyticsForwarder {
  /** Whether a configured Umami address may be called (HTTPS servers only). */
  abstract accepts(url: string): boolean;
  /** Throws when Umami could not be reached or refused the view. */
  abstract send(view: PageView): Promise<void>;
}
