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
export interface FacilityUsage {
  id: string;
  name: string;
  sport: Sport;
  bookings: number;
  confirmed: number;
  cancelled: number;
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
  /** Null until attendance tracking (#16) exists. */
  noShows: number | null;
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
export interface OperatorSession {
  operatorId: string;
  displayName: string;
}
export interface StaffMember {
  id: string;
  municipalityId: string;
  displayName: string;
  email: string | null;
}
export interface DeploymentMunicipality {
  settings: MunicipalitySettings;
  facilities: number;
  activeFacilities: number;
  managers: StaffMember[];
}
export interface NewMunicipality {
  id: string;
  slug: string;
  name: string;
  timezone: string;
  locale: Locale;
  contact: string;
  legalTexts: LegalTexts;
}
export interface NewManager {
  id: string;
  displayName: string;
  email: string;
}
export interface InsightTotals {
  total: number;
  confirmed: number;
  cancelled: number;
  noShows: number | null;
  bookedMinutes: number;
  openMinutes: number;
  occupancy: number | null;
  facilities: number;
}
export interface MunicipalityTotals extends InsightTotals, DateRange {
  id: string;
  slug: string;
  name: string;
}
export interface DeploymentInsights extends InsightTotals {
  municipalities: MunicipalityTotals[];
}
