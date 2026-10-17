// SPDX-License-Identifier: AGPL-3.0-or-later
import type { Temporal } from "@js-temporal/polyfill";
import type { Result } from "../../../shared/application/result";
import type { AppError } from "../../../shared/application/errors";
import type { Booking } from "./booking.entity";
import type { BookingReadModel } from "./booking.read-model";
export abstract class BookingRepository {
  abstract lockUser(tenantId: string, userId: string): Promise<void>;
  abstract find(
    tenantId: string,
    userId: string,
    id: string,
  ): Promise<Booking | null>;
  abstract list(tenantId: string, userId: string): Promise<BookingReadModel[]>;
  abstract countActive(
    tenantId: string,
    userId: string,
    now: Temporal.Instant,
  ): Promise<number>;
  abstract save(
    booking: Booking,
  ): Promise<Result<void, AppError<"slot_taken"> | AppError<"id_reused">>>;
}
