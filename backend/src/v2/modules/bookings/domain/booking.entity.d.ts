// SPDX-License-Identifier: AGPL-3.0-or-later
import type { Temporal } from "@js-temporal/polyfill";
import type { TariffCategory } from "../../../shared/application/categories";
interface BookingBase {
  id: string;
  tenantId: string;
  /** Stays a string: retention detaches past rows (NULL user_id) but no read path returns them. */
  userId: string;
  facilityId: string;
  /** Booked court or space of the facility; it determines the occupied units. */
  resourceId: string;
  start: Temporal.Instant;
  end: Temporal.Instant;
  createdAt: Temporal.Instant;
  /** Deadline in force when booked or last rescheduled; null for rows older than the snapshot. */
  cancellationHours: number | null;
  /** Tariff in force when booked or last rescheduled; null for rows older than the snapshot. */
  tariffCategory: TariffCategory | null;
  priceCents: number | null;
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
