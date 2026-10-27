// SPDX-License-Identifier: AGPL-3.0-or-later
import type { Temporal } from "@js-temporal/polyfill";
interface BookingBase {
  id: string;
  tenantId: string;
  /** Stays a string: retention detaches past rows (NULL user_id) but no read path returns them. */
  userId: string;
  facilityId: string;
  start: Temporal.Instant;
  end: Temporal.Instant;
  createdAt: Temporal.Instant;
  /** Deadline in force when booked or last rescheduled; null for rows older than the snapshot. */
  cancellationHours: number | null;
}
export interface ConfirmedBooking extends BookingBase {
  status: "confirmed";
}
/** Marked by the municipality on the day; reverting it makes the booking confirmed again. */
export interface NoShowBooking extends BookingBase {
  status: "no_show";
}
export interface CancelledBooking extends BookingBase {
  status: "cancelled";
  cancelledAt: Temporal.Instant;
  /** null for cancellations recorded before the field existed. */
  cancelledBy: "citizen" | "municipality" | null;
  /** Required when the municipality cancels. */
  cancellationReason: string | null;
}
export type Booking = ConfirmedBooking | NoShowBooking | CancelledBooking;
/** What the booking means to people: a confirmed booking that has ended counts as attended. */
export type BookingOutcome = "upcoming" | "attended" | "no_show" | "cancelled";
