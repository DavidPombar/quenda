// SPDX-License-Identifier: AGPL-3.0-or-later
export type Locale = "gl" | "es";
export interface Municipality {
  id: string;
  slug: string;
  name: string;
  timezone: string;
  /** Default language; the person's saved choice takes precedence. */
  locale: Locale;
  advanceDays: number;
  cancellationHours: number;
  maxActiveBookings: number;
  contact: string;
  legalTexts: LegalTexts;
  legalVersion: string;
  primaryColor: string;
  logoUrl: string | null;
  /** No-shows within the window that block new bookings; 0 disables the penalty. */
  noShowLimit: number;
  noShowWindowDays: number;
  noShowBlockDays: number;
}
export interface LegalTexts {
  gl: string;
  es: string;
}
export interface MunicipalitySettings extends Municipality {
  /** RFC 5545 VCALENDAR of all-day municipal holidays. */
  holidaysCalendar: string;
}
export type SettingsPatch = Partial<
  Pick<
    MunicipalitySettings,
    | "locale"
    | "advanceDays"
    | "cancellationHours"
    | "maxActiveBookings"
    | "contact"
    | "legalTexts"
    | "primaryColor"
    | "holidaysCalendar"
    | "noShowLimit"
    | "noShowWindowDays"
    | "noShowBlockDays"
  >
>;
export interface SettingsUpdate {
  settings: MunicipalitySettings;
  affectedBookings: number;
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
  followsMunicipalHolidays: boolean;
}
export interface Slot {
  start: string;
  end: string;
  status: "available" | "booked" | "past";
}
export type BookingOutcome = "upcoming" | "attended" | "no_show" | "cancelled";
/** One person's reservation as the municipality sees it on the bookings page. */
export interface ManagedBooking {
  id: string;
  facilityId: string;
  facilityName: string;
  sport: Sport;
  start: string;
  end: string;
  status: "confirmed" | "cancelled" | "no_show";
  outcome: BookingOutcome;
  cancelledBy: "citizen" | "municipality" | null;
  cancellationReason: string | null;
  displayName: string;
  canMarkNoShow: boolean;
  canRevert: boolean;
  canCancel: boolean;
}
export type BookingChange =
  | { attendance: "no_show" | "attended" }
  | { status: "cancelled"; reason: string };
/** Upcoming bookings a closure would cancel. */
export interface FacilityImpact {
  bookings: number;
  people: number;
}
export interface FacilityUsage {
  id: string;
  name: string;
  sport: Sport;
  bookings: number;
  confirmed: number;
  cancelled: number;
  noShows: number;
  bookedMinutes: number;
  openMinutes: number;
  /** Booked over open time, rounded percent; null when never open. */
  occupancy: number | null;
}
export interface HeatmapCell {
  /** ISO weekday, 1 = Monday. */
  weekday: number;
  hour: number;
  bookedMinutes: number;
  openMinutes: number;
  occupancy: number;
}
export interface DateRange {
  from: string;
  to: string;
}
export interface Insights extends DateRange {
  total: number;
  confirmed: number;
  cancelled: number;
  /** Booked but not used; not counted as booked time. */
  noShows: number;
  bookedMinutes: number;
  openMinutes: number;
  occupancy: number | null;
  facilities: number;
  byFacility: FacilityUsage[];
  /** Only weekday × hour cells with open time. */
  heatmap: HeatmapCell[];
}
export type AuditActorRole = "citizen" | "manager" | "system";
export interface AuditEvent {
  id: string;
  action: string;
  actorId: string | null;
  actorRole: AuditActorRole | null;
  actorName: string | null;
  resourceId: string;
  occurredAt: string;
  details: Record<string, unknown> | null;
}
export interface AuditFilters {
  from?: string;
  to?: string;
  action?: string;
  limit?: number;
}
