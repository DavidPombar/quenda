// SPDX-License-Identifier: AGPL-3.0-or-later
import type { AnalyticsApp } from "../../../shared/application/analytics-config";
/**
 * The only events counted, with fixed names and no properties, so nothing about a person or a
 * reservation reaches Umami (#57). The app's funnel is search → slot → booking.
 */
export const analyticsEvents = {
  app: ["search", "slot-open", "booking-confirmed", "suggestion-picked"],
  web: ["search"],
} as const satisfies Record<AnalyticsApp, readonly string[]>;
export const allAnalyticsEvents = [
  ...new Set([...analyticsEvents.app, ...analyticsEvents.web]),
];
export function isAnalyticsEvent(app: AnalyticsApp, name: string) {
  return (analyticsEvents[app] as readonly string[]).includes(name);
}
/** Do Not Track and Global Privacy Control both mean "do not count me". */
export function optedOut(headers: { dnt?: string; gpc?: string }) {
  return headers.dnt === "1" || headers.gpc === "1";
}
