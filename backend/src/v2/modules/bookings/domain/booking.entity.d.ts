// SPDX-License-Identifier: AGPL-3.0-or-later
import type { Temporal } from "@js-temporal/polyfill";
import type { TariffCategory } from "../../../shared/application/categories";
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
  /** Tariff in force when booked or last rescheduled; null for rows older than the snapshot. */
  tariffCategory: TariffCategory | null;
  priceCents: number | null;
}
export interface ConfirmedBooking extends BookingBase {
  status: "confirmed";
}
export interface CancelledBooking extends BookingBase {
  status: "cancelled";
  cancelledAt: Temporal.Instant;
}
export type Booking = ConfirmedBooking | CancelledBooking;
