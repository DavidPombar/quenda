// SPDX-License-Identifier: AGPL-3.0-or-later
import type { Temporal } from "@js-temporal/polyfill";
import type { Result } from "../../../shared/application/result";
import type { AppError } from "../../../shared/application/errors";
/** Occupied units of confirmed reservations; the store rejects overlaps on the same unit. */
export abstract class BookingUnitRepository {
  /** Replaces the reservation's units with `unitIds` over the interval. */
  abstract replace(args: {
    tenantId: string;
    bookingId: string;
    unitIds: readonly string[];
    start: Temporal.Instant;
    end: Temporal.Instant;
  }): Promise<Result<void, AppError<"slot_taken">>>;
  /** Frees every unit of the reservation. */
  abstract release(tenantId: string, bookingId: string): Promise<void>;
}
