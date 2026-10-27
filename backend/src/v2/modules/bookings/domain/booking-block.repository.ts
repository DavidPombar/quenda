// SPDX-License-Identifier: AGPL-3.0-or-later
import type { Temporal } from "@js-temporal/polyfill";
export interface BookingBlock {
  id: string;
  tenantId: string;
  userId: string;
  /** The no-show that reached the limit. */
  bookingId: string;
  start: Temporal.Instant;
  end: Temporal.Instant;
}
/** Temporary bans on new bookings after repeated no-shows. */
export abstract class BookingBlockRepository {
  /** The block in force at `now` that has not been lifted, if any. */
  abstract active(
    tenantId: string,
    userId: string,
    now: Temporal.Instant,
  ): Promise<BookingBlock | null>;
  abstract add(block: BookingBlock): Promise<void>;
  abstract lift(
    tenantId: string,
    id: string,
    at: Temporal.Instant,
  ): Promise<void>;
}
