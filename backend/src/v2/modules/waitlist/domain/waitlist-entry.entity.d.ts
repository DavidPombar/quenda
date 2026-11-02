// SPDX-License-Identifier: AGPL-3.0-or-later
import type { Temporal } from "@js-temporal/polyfill";
/**
 * `waiting` and `offered` are open; the rest are final. An entry is offered at most once: when
 * the person lets the offer expire or leaves, the place goes to the next one.
 */
export type WaitlistStatus =
  "waiting" | "offered" | "accepted" | "expired" | "left" | "closed";
/** A person waiting for one slot of one court that was full (#96). */
export interface WaitlistEntry {
  id: string;
  tenantId: string;
  userId: string;
  facilityId: string;
  resourceId: string;
  start: Temporal.Instant;
  end: Temporal.Instant;
  createdAt: Temporal.Instant;
  status: WaitlistStatus;
  offeredAt: Temporal.Instant | null;
  /** Until when the place is held for the person; set while offered. */
  offerExpiresAt: Temporal.Instant | null;
}
/** An open entry as the person sees it. */
export interface WaitlistEntryView extends WaitlistEntry {
  facilityName: string;
  resourceName: string;
  /** Place in the queue among the people still waiting, from 1; 0 while offered. */
  position: number;
}
