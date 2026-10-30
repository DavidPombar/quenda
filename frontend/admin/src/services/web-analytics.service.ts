// SPDX-License-Identifier: AGPL-3.0-or-later
import type { TextKey } from "@/services/i18n.service";
import type { Locale } from "@/types/models";
const EVENT_LABELS: Record<string, TextKey> = {
  search: "eventSearch",
  "slot-open": "eventSlotOpen",
  "booking-confirmed": "eventBookingConfirmed",
  "suggestion-picked": "eventSuggestionPicked",
};
const DEVICE_LABELS: Record<string, TextKey> = {
  desktop: "deviceDesktop",
  laptop: "deviceLaptop",
  mobile: "deviceMobile",
  tablet: "deviceTablet",
};
/** "2 min 05 s" style length of a visit; "—" without visits. */
export function durationLabel(seconds: number | null) {
  if (seconds === null) return "—";
  const minutes = Math.floor(seconds / 60);
  const rest = String(seconds % 60).padStart(2, "0");
  return minutes ? `${minutes} min ${rest} s` : `${seconds} s`;
}
/** Readable names for Umami's raw values; unknown ones are shown as they come. */
export function rankedLabel(
  list: "events" | "devices" | "languages" | "referrers" | "pages",
  value: string,
  t: (key: TextKey) => string,
  locale: Locale,
) {
  const known =
    list === "events"
      ? EVENT_LABELS[value]
      : list === "devices"
        ? DEVICE_LABELS[value]
        : undefined;
  if (known) return t(known);
  if (list === "languages")
    try {
      return (
        new Intl.DisplayNames([locale], { type: "language" }).of(value) ?? value
      );
    } catch {
      return value;
    }
  return value;
}
export function countLabel(value: number, locale: Locale) {
  return value.toLocaleString(locale === "es" ? "es-ES" : "gl-ES");
}
