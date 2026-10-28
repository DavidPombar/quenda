// SPDX-License-Identifier: AGPL-3.0-or-later
import { Temporal } from "@js-temporal/polyfill";
import type { DateRange, Locale } from "@/types/models";
import { intlLocale, isPlainDate } from "@/services/date.service";
/** Longest range the API accepts (agreed in #15). */
export const MAX_RANGE_MONTHS = 16;
export type RangeError =
  "insightsRangeInvalid" | "insightsRangeOrder" | "insightsRangeLong";
/** Calendar month containing `date`, shifted by `offset` months. */
export function monthRange(date: string, offset = 0): DateRange {
  const first = Temporal.PlainDate.from(date)
    .with({ day: 1 })
    .add({ months: offset });
  return {
    from: first.toString(),
    to: first.add({ months: 1 }).subtract({ days: 1 }).toString(),
  };
}
export function rangeError(range: DateRange): RangeError | null {
  if (!isPlainDate(range.from) || !isPlainDate(range.to))
    return "insightsRangeInvalid";
  const from = Temporal.PlainDate.from(range.from);
  const to = Temporal.PlainDate.from(range.to);
  if (Temporal.PlainDate.compare(from, to) > 0) return "insightsRangeOrder";
  if (
    Temporal.PlainDate.compare(to, from.add({ months: MAX_RANGE_MONTHS })) >= 0
  )
    return "insightsRangeLong";
  return null;
}
/** Same-origin download; the session cookie authorises it and `lang` sets the headers. */
export function exportUrl(range: DateRange, locale: Locale) {
  return `/v2/manager/insights/export?${new URLSearchParams({ ...range, lang: locale }).toString()}`;
}
/** Five-step scale for the heatmap: 0 %, under 25, under 50, under 75, 75 or more. */
export function heatLevel(occupancy: number) {
  if (occupancy <= 0) return 0;
  if (occupancy < 25) return 1;
  if (occupancy < 50) return 2;
  if (occupancy < 75) return 3;
  return 4;
}
export function hoursLabel(minutes: number, locale: Locale) {
  return `${(minutes / 60).toLocaleString(intlLocale(locale), {
    maximumFractionDigits: 1,
  })} h`;
}
export function percentLabel(value: number | null) {
  return value === null ? "—" : `${value} %`;
}
/** Signed difference in percentage points, or null when either side is missing. */
export function pointsDelta(current: number | null, previous: number | null) {
  if (current === null || previous === null) return null;
  const delta = current - previous;
  return `${delta > 0 ? "+" : delta < 0 ? "−" : "±"}${Math.abs(delta)}`;
}
