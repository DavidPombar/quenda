// SPDX-License-Identifier: AGPL-3.0-or-later
import { Temporal } from "@js-temporal/polyfill";
import type { Booking, BookingOutcome } from "./booking.entity";
export function bookingOutcome(
  booking: Booking,
  now: Temporal.Instant,
): BookingOutcome {
  if (booking.status !== "confirmed") return booking.status;
  return Temporal.Instant.compare(booking.end, now) <= 0
    ? "attended"
    : "upcoming";
}
