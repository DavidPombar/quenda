// SPDX-License-Identifier: AGPL-3.0-or-later
import type { Temporal } from "@js-temporal/polyfill";
export abstract class Clock {
  abstract now(): Temporal.Instant;
}
