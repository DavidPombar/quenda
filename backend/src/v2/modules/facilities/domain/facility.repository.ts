// SPDX-License-Identifier: AGPL-3.0-or-later
import type { Facility } from "./facility.entity";
import type { Temporal } from "@js-temporal/polyfill";
import type { Result } from "../../../shared/application/result";
import type { AppError } from "../../../shared/application/errors";
export interface UpcomingBooking {
  id: string;
  userId: string;
  start: Temporal.Instant;
  end: Temporal.Instant;
}
export abstract class FacilityRepository {
  abstract list(tenantId: string): Promise<Facility[]>;
  abstract find(
    tenantId: string,
    id: string,
    lock?: boolean,
  ): Promise<Facility | null>;
  abstract save(
    facility: Facility,
  ): Promise<Result<void, AppError<"id_reused">>>;
  /** Confirmed bookings of people that have not ended yet. */
  abstract upcomingBookings(
    tenantId: string,
    id: string,
    now: Temporal.Instant,
  ): Promise<UpcomingBooking[]>;
  /** Cancels bookings on behalf of the municipality and adds one notice per booking. */
  abstract cancelBookings(args: {
    tenantId: string;
    bookings: readonly { id: string; userId: string; notificationId: string }[];
    reason: string;
    at: Temporal.Instant;
  }): Promise<void>;
  abstract busy(
    tenantId: string,
    id: string,
    dateStart: Temporal.Instant,
    dateEnd: Temporal.Instant,
  ): Promise<{ start: Temporal.Instant; end: Temporal.Instant }[]>;
}
