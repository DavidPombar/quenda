// SPDX-License-Identifier: AGPL-3.0-or-later
import type { Temporal } from "@js-temporal/polyfill";
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
}
export interface ConfirmedBooking extends BookingBase {
  status: "confirmed";
}
export interface CancelledBooking extends BookingBase {
  status: "cancelled";
  cancelledAt: Temporal.Instant;
}
export type Booking = ConfirmedBooking | CancelledBooking;
