// SPDX-License-Identifier: AGPL-3.0-or-later
import type { Booking } from "./booking.entity";
import type { SportArt } from "../../facilities/domain/sport.entity";
export interface BookingReadModel {
  booking: Booking;
  facilityName: string;
  resourceName: string;
  sport: string;
  /** Name of the sport in the municipality's catalogue (#26). */
  sportName: { gl: string; es: string };
  sportArt: SportArt;
}
export interface ManagedBookingReadModel extends BookingReadModel {
  displayName: string;
}
