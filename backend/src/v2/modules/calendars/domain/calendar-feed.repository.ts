// SPDX-License-Identifier: AGPL-3.0-or-later
import type { Temporal } from "@js-temporal/polyfill";
export interface CalendarFeedOwner {
  tenantId: string;
  userId: string;
}
/** A person has at most one subscription token; only its hash is stored. */
export abstract class CalendarFeedRepository {
  /** Replaces any previous token and returns the new secret once. */
  abstract rotate(
    owner: CalendarFeedOwner,
    createdAt: Temporal.Instant,
  ): Promise<string>;
  abstract revoke(owner: CalendarFeedOwner): Promise<void>;
  abstract createdAt(
    owner: CalendarFeedOwner,
  ): Promise<Temporal.Instant | null>;
  abstract findOwner(token: string): Promise<CalendarFeedOwner | null>;
}
