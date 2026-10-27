// SPDX-License-Identifier: AGPL-3.0-or-later
import { Temporal } from "@js-temporal/polyfill";
import type { MunicipalitySettings } from "../../../shared/application/municipality-settings";
type PenaltySettings = Pick<
  MunicipalitySettings,
  "timezone" | "noShowLimit" | "noShowWindowDays" | "noShowBlockDays"
>;
export interface PenaltyStanding {
  enabled: boolean;
  /** No-shows that started within the window. */
  count: number;
  limit: number;
  windowDays: number;
  blockDays: number;
  /** No-shows still allowed before the block; 0 when disabled or reached. */
  remaining: number;
  blockedUntil: Temporal.Instant | null;
}
/** Instant from which no-shows count towards the limit. */
export function windowStart(
  settings: PenaltySettings,
  now: Temporal.Instant,
): Temporal.Instant {
  return now
    .toZonedDateTimeISO(settings.timezone)
    .subtract({ days: settings.noShowWindowDays })
    .toInstant();
}
export function penaltyStanding(args: {
  noShowStarts: readonly Temporal.Instant[];
  settings: PenaltySettings;
  now: Temporal.Instant;
  blockedUntil: Temporal.Instant | null;
}): PenaltyStanding {
  const since = windowStart(args.settings, args.now);
  const count = args.noShowStarts.filter(
    (start) =>
      Temporal.Instant.compare(start, since) >= 0 &&
      Temporal.Instant.compare(start, args.now) <= 0,
  ).length;
  const enabled = args.settings.noShowLimit > 0;
  return {
    enabled,
    count,
    limit: args.settings.noShowLimit,
    windowDays: args.settings.noShowWindowDays,
    blockDays: args.settings.noShowBlockDays,
    remaining: enabled ? Math.max(args.settings.noShowLimit - count, 0) : 0,
    blockedUntil: args.blockedUntil,
  };
}
/** Whether a new no-show starts a block: the limit is reached and none is in force. */
export function reachesLimit(standing: PenaltyStanding) {
  return (
    standing.enabled &&
    standing.blockedUntil === null &&
    standing.count >= standing.limit
  );
}
export function blockEnd(settings: PenaltySettings, now: Temporal.Instant) {
  return now
    .toZonedDateTimeISO(settings.timezone)
    .add({ days: settings.noShowBlockDays })
    .toInstant();
}
