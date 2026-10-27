// SPDX-License-Identifier: AGPL-3.0-or-later
import type { Booking } from "./booking.entity";
export interface BookingReadModel {
  booking: Booking;
  facilityName: string;
  sport: string;
}
export interface ManagedBookingReadModel extends BookingReadModel {
  displayName: string;
}
