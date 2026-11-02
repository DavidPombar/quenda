// SPDX-License-Identifier: AGPL-3.0-or-later
import type { Temporal } from "@js-temporal/polyfill";
/**
 * The waiting list (#96) as seen by the commands that free or remove places. Each call runs in
 * the caller's transaction, so an offer commits with the cancellation that made it possible.
 */
export abstract class WaitlistOffers {
  /**
   * Offers the places now free in `[start, end)` of the facility to the people waiting, oldest
   * first: each offer holds the place and notifies the person. Takes the facility lock.
   */
  abstract offer(args: {
    tenantId: string;
    facilityId: string;
    start: Temporal.Instant;
    end: Temporal.Instant;
    now: Temporal.Instant;
  }): Promise<number>;
  /**
   * Turns the person's open offer for that slot of the court into the reservation `bookingId`,
   * releasing its hold so the reservation can take the place. False when there is no such offer
   * or it has expired; the caller's rollback restores the hold if the reservation fails.
   */
  abstract accept(args: {
    tenantId: string;
    userId: string;
    entryId: string;
    resourceId: string;
    start: Temporal.Instant;
    bookingId: string;
    timezone: string;
    now: Temporal.Instant;
  }): Promise<boolean>;
  /** Ends every open entry of a facility that stops taking reservations, releasing its holds. */
  abstract close(tenantId: string, facilityId: string): Promise<void>;
  /** Removes a person's entries (account deletion), releasing holds and offering them on. */
  abstract forget(
    tenantId: string,
    userId: string,
    now: Temporal.Instant,
  ): Promise<void>;
}
