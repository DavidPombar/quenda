// SPDX-License-Identifier: AGPL-3.0-or-later
import type { Temporal } from "@js-temporal/polyfill";
import type { Result } from "../../../shared/application/result";
import type { AppError } from "../../../shared/application/errors";
/**
 * Occupied units of confirmed reservations and no-shows. Exclusive units never overlap (the store
 * rejects it); a unit with a capacity holds that many shared places at once (#95).
 */
export abstract class BookingUnitRepository {
  /**
   * Replaces the reservation's units with `unitIds` over the interval. With `place`, the
   * reservation takes one shared place of a single unit; the caller holds the facility lock, so
   * the count of places cannot change underneath.
   */
  abstract replace(args: {
    tenantId: string;
    bookingId: string;
    unitIds: readonly string[];
    start: Temporal.Instant;
    end: Temporal.Instant;
    place: { capacity: number; userId: string } | null;
  }): Promise<
    Result<void, AppError<"slot_taken"> | AppError<"already_booked">>
  >;
  /** Frees every unit of the reservation. */
  abstract release(tenantId: string, bookingId: string): Promise<void>;
}
