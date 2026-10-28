// SPDX-License-Identifier: AGPL-3.0-or-later
import type { Temporal } from "@js-temporal/polyfill";
export interface OpeningInterval {
  start: Temporal.Instant;
  end: Temporal.Instant;
}
export abstract class OpeningCalendar {
  abstract validate(calendar: string, timezone: string): boolean;
  abstract expand(args: {
    calendar: string;
    timezone: string;
    date: Temporal.PlainDate;
  }): OpeningInterval[];
  /** Merged opening intervals overlapping the local dates from–to (inclusive), parsed once. */
  abstract expandRange(args: {
    calendar: string;
    timezone: string;
    from: Temporal.PlainDate;
    to: Temporal.PlainDate;
  }): OpeningInterval[];
}
