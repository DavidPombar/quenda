// SPDX-License-Identifier: AGPL-3.0-or-later
export type Locale = "gl" | "es";
export interface Municipality {
  id: string;
  slug: string;
  name: string;
  timezone: string;
  locale: string;
  advanceDays: number;
  cancellationHours: number;
  maxActiveBookings: number;
  contact: string;
  legalText: string;
}
export interface Session {
  userId: string;
  tenantId: string;
  displayName: string;
  role: "citizen" | "manager";
}
export type Sport = "padel" | "tennis" | "futsal" | "swimming";
export interface Facility {
  id: string;
  name: string;
  sport: Sport;
  address: string;
  description: string;
  accessible: boolean;
  status: "active" | "maintenance" | "closed";
  slotMinutes: number;
  priceCents: number;
  openingCalendar: string;
  rules: string;
}
export interface Slot {
  start: string;
  end: string;
  status: "available" | "booked" | "past";
}
export interface Booking {
  id: string;
  facilityId: string;
  facilityName: string;
  sport: Sport;
  start: string;
  end: string;
  status: "confirmed" | "cancelled";
}
export interface Notification {
  id: string;
  bookingId: string;
  kind: "confirmed" | "rescheduled" | "cancelled";
  facilityName: string;
  createdAt: string;
}
export interface Insights {
  total: number;
  confirmed: number;
  cancelled: number;
  occupancy: number;
  facilities: number;
  from: string;
  to: string;
  byFacility: { id: string; name: string; bookings: number }[];
}
/** Only the fields the backoffice reads; the full format is documented in docs/architecture. */
export interface MunicipalityExport {
  format: "quenda-municipality-export";
  version: number;
  exportedAt: string;
  municipality: { slug: string };
}
