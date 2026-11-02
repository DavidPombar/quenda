// SPDX-License-Identifier: AGPL-3.0-or-later
import type { Temporal } from "@js-temporal/polyfill";
import type { WaitlistEntry, WaitlistEntryView } from "./waitlist-entry.entity";
export abstract class WaitlistRepository {
  abstract add(entry: WaitlistEntry): Promise<void>;
  abstract find(tenantId: string, id: string): Promise<WaitlistEntry | null>;
  /** The person's open entry for this slot of the court, if any. */
  abstract findOpen(args: {
    tenantId: string;
    userId: string;
    resourceId: string;
    start: Temporal.Instant;
  }): Promise<WaitlistEntry | null>;
  abstract countOpen(tenantId: string, userId: string): Promise<number>;
  /** Whether the person already has a reservation of this court at that time. */
  abstract hasBooking(args: {
    tenantId: string;
    userId: string;
    resourceId: string;
    start: Temporal.Instant;
    end: Temporal.Instant;
  }): Promise<boolean>;
  abstract listOpen(
    tenantId: string,
    userId: string,
  ): Promise<WaitlistEntryView[]>;
  /** People waiting for a slot of the facility overlapping the interval, oldest first. */
  abstract queue(args: {
    tenantId: string;
    facilityId: string;
    start: Temporal.Instant;
    end: Temporal.Instant;
    now: Temporal.Instant;
  }): Promise<WaitlistEntry[]>;
  abstract offer(
    tenantId: string,
    id: string,
    at: Temporal.Instant,
    expiresAt: Temporal.Instant,
  ): Promise<void>;
  /**
   * Accepts the person's open offer for that slot of the court, if it is still valid at `now`;
   * returns the entry, or null when there is no such offer.
   */
  abstract accept(args: {
    tenantId: string;
    userId: string;
    id: string;
    resourceId: string;
    start: Temporal.Instant;
    bookingId: string;
    now: Temporal.Instant;
  }): Promise<WaitlistEntry | null>;
  /** Ends an open entry; returns it as it was, or null when it was not open. */
  abstract end(
    tenantId: string,
    id: string,
    status: "expired" | "left" | "closed",
  ): Promise<WaitlistEntry | null>;
  /** Open offers whose time is up at `now`. */
  abstract expiredOffers(
    tenantId: string,
    now: Temporal.Instant,
  ): Promise<WaitlistEntry[]>;
  abstract openOfFacility(
    tenantId: string,
    facilityId: string,
  ): Promise<WaitlistEntry[]>;
  abstract openOfUser(
    tenantId: string,
    userId: string,
  ): Promise<WaitlistEntry[]>;
  /** Deletes every entry of the person, open or not (account deletion). */
  abstract deleteOfUser(tenantId: string, userId: string): Promise<void>;
  /** Deletes the entries of slots that have ended, with their holds; returns how many. */
  abstract deletePast(tenantId: string, now: Temporal.Instant): Promise<number>;
  /** Counts an accepted or expired offer for the indicators, without personal data. */
  abstract recordOutcome(args: {
    tenantId: string;
    facilityId: string;
    day: Temporal.PlainDate;
    outcome: "accepted" | "expired";
  }): Promise<void>;
}
