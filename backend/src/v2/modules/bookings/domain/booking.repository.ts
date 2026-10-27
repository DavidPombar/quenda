// SPDX-License-Identifier: AGPL-3.0-or-later
import type { Temporal } from "@js-temporal/polyfill";
import type { Result } from "../../../shared/application/result";
import type { AppError } from "../../../shared/application/errors";
import type { Booking } from "./booking.entity";
import type {
  BookingReadModel,
  ManagedBookingReadModel,
} from "./booking.read-model";
export abstract class BookingRepository {
  abstract lockUser(tenantId: string, userId: string): Promise<void>;
  abstract find(
    tenantId: string,
    userId: string,
    id: string,
  ): Promise<Booking | null>;
  /** Any person's booking in the tenant, for municipal actions. */
  abstract findInTenant(tenantId: string, id: string): Promise<Booking | null>;
  /** Whether access staff recorded the person entering for this reservation. */
  abstract hasCheckIn(tenantId: string, id: string): Promise<boolean>;
  abstract list(tenantId: string, userId: string): Promise<BookingReadModel[]>;
  /** Bookings starting in [from, to), optionally for one facility, with the person's name. */
  abstract listStarting(args: {
    tenantId: string;
    from: Temporal.Instant;
    to: Temporal.Instant;
    facilityId?: string;
  }): Promise<ManagedBookingReadModel[]>;
  /** Starts of the person's no-shows from `since` onwards. */
  abstract noShowStarts(
    tenantId: string,
    userId: string,
    since: Temporal.Instant,
  ): Promise<Temporal.Instant[]>;
  abstract countActive(
    tenantId: string,
    userId: string,
    now: Temporal.Instant,
  ): Promise<number>;
  abstract save(
    booking: Booking,
  ): Promise<Result<void, AppError<"slot_taken"> | AppError<"id_reused">>>;
}
