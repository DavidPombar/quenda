// SPDX-License-Identifier: AGPL-3.0-or-later
export type Locale = "gl" | "es";
/** User categories a municipality can price differently (M2). */
export type Category =
  | "resident"
  | "family"
  | "local_club"
  | "minor"
  | "large_family"
  | "disability"
  | "senior";
export const CATEGORIES: readonly Category[] = [
  "resident",
  "family",
  "local_club",
  "minor",
  "large_family",
  "disability",
  "senior",
];
export interface CategoryPrice {
  category: Category;
  priceCents: number;
}
export interface UserCategory {
  category: Category;
  status: "requested" | "verified" | "rejected";
  requestedAt: string | null;
  decidedAt: string | null;
}
export interface CategoryRequest {
  userId: string;
  displayName: string;
  category: Category;
  requestedAt: string;
}
export interface CitizenCategories {
  userId: string;
  displayName: string;
  categories: UserCategory[];
}
export interface Accessibility {
  unit: string;
  email: string;
  phone: string;
  reviewedOn: string;
  method: "self" | "external";
  exceptions: Record<Locale, string>;
}
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
  enabledCategories: Category[];
  /** No-shows within the window that block new bookings; 0 disables the penalty. */
  noShowLimit: number;
  noShowWindowDays: number;
  noShowBlockDays: number;
  accessibility: Accessibility;
  /** Licence of the published open data. */
  dataLicense: DataLicense;
  /** DIR3 code, publisher of the DCAT catalogue; null when not set. */
  dir3Code: string | null;
}
export const DATA_LICENSES = [
  "CC-BY-4.0",
  "CC-BY-SA-4.0",
  "CC0-1.0",
  "ODbL-1.0",
] as const;
export type DataLicense = (typeof DATA_LICENSES)[number];
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
    | "enabledCategories"
    | "noShowLimit"
    | "noShowWindowDays"
    | "noShowBlockDays"
    | "dataLicense"
    | "dir3Code"
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
  role: "citizen" | "manager" | "access";
}
/** Code of a sport in the municipality's catalogue. */
export type Sport = string;
/** Illustration and colour of a sport; sports without their own use the generic ones. */
export type SportArt = "padel" | "tennis" | "futsal" | "swimming" | "generic";
export interface SportName {
  gl: string;
  es: string;
}
/** A sport of the municipality's catalogue, as the manager edits it. */
export interface ManagedSport {
  code: string;
  name: SportName;
  cnidClass: string;
  cnidType: string;
  schemaType: string;
  art: SportArt;
  visible: boolean;
  position: number;
}
export interface SportDraft {
  code: string;
  nameGl: string;
  nameEs: string;
  cnidClass: string;
  cnidType: string;
  schemaType: string;
  art: SportArt;
  visible: boolean;
}
export interface Facility {
  id: string;
  name: string;
  sport: Sport;
  /** Read-only, from the API: the sport's name and illustration. */
  sportName?: SportName;
  sportArt?: SportArt;
  address: string;
  description: string;
  accessible: boolean;
  status: "active" | "maintenance" | "closed";
  slotMinutes: number;
  priceCents: number;
  prices: CategoryPrice[];
  openingCalendar: string;
  rules: string;
  followsMunicipalHolidays: boolean;
  /** WGS 84 position, published as open data; both set or both null. */
  latitude: number | null;
  longitude: number | null;
  /** Courts and spaces, ordered by position; parts point at their whole court. */
  resources?: Resource[];
}
/** A bookable court or space of a facility. */
export interface Resource {
  id: string;
  name: string;
  parentId: string | null;
  active: boolean;
  position: number;
}
export type ResourceDraft = Omit<Resource, "position">;
export interface Slot {
  start: string;
  end: string;
  status: "available" | "booked" | "season" | "past";
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
  /** Courts in service; a whole court aggregates the time of its parts. */
  byResource: ResourceUsage[];
}
export interface ResourceUsage {
  id: string;
  name: string;
  parentId: string | null;
  confirmed: number;
  cancelled: number;
  noShows: number;
  bookedMinutes: number;
  openMinutes: number;
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
export type AuditActorRole = "citizen" | "manager" | "access" | "system";
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
/** One reservation as the door sees it on the day. */
export interface AccessBooking {
  sequence: number;
  validFrom: string;
  id: string;
  code: string;
  facilityId: string;
  facilityName: string;
  start: string;
  end: string;
  status: "confirmed" | "cancelled" | "no_show";
  holder: string;
  checkedInAt: string | null;
}
/** Snapshot kept on the device so passes can be checked without a network. */
export interface AccessDay {
  date: string;
  syncedAt: string;
  issuer: string;
  keys: Record<string, string>[];
  bookings: AccessBooking[];
  revoked: string[];
}
export interface CheckIn {
  sequence: number;
  bookingId: string;
  checkedInAt: string;
  method: "qr" | "manual";
}
export type CheckInOutcome =
  | "recorded"
  | "duplicate"
  | "cancelled"
  | "no_show"
  | "out_of_window"
  | "not_found"
  | "stale";
export interface AccessSettings {
  webhookUrl: string;
  hasWebhookSecret: boolean;
  keys: { kid: string; createdAt: string; retiredAt: string | null }[];
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
  noShows: number;
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
/** Only the fields the backoffice reads; the full format is documented in docs/architecture. */
export interface MunicipalityExport {
  format: "quenda-municipality-export";
  version: number;
  exportedAt: string;
  municipality: { slug: string };
}
/** Season allocation to clubs (#17). */
export interface Organization {
  id: string;
  name: string;
  taxId: string | null;
  sport: Sport | null;
  contactEmail: string | null;
  createdAt: string;
  archivedAt: string | null;
  representatives: {
    userId: string;
    displayName: string;
    email: string | null;
  }[];
}
export interface OrganizationInput {
  name: string;
  taxId: string | null;
  sport: Sport | null;
  contactEmail: string | null;
}
export interface Campaign {
  id: string;
  name: string;
  startsOn: string;
  endsOn: string;
  criteria: { gl: string; es: string };
  facilityIds: string[];
}
export type CampaignInput = Omit<Campaign, "id">;
export interface SeasonConflict {
  occurrenceId: string;
  start: string;
  end: string;
  bookingId: string | null;
}
export interface SeasonAllocation {
  id: string;
  campaignId: string;
  organizationId: string;
  organizationName: string;
  facilityId: string;
  facilityName: string;
  resourceId: string;
  resourceName: string;
  weekdays: number[];
  startsLocal: string;
  endsLocal: string;
  reason: string;
  createdAt: string;
  cancelledAt: string | null;
  cancellationReason: string | null;
  active: number;
  cancelled: number;
  conflicts: SeasonConflict[];
  dates: { id: string; start: string; end: string }[];
}
export interface SeasonSlotInput {
  campaignId: string;
  organizationId: string;
  facilityId: string;
  resourceId: string;
  weekdays: number[];
  startsLocal: string;
  endsLocal: string;
  reason: string;
}
export interface SeasonAssignment {
  allocation: SeasonAllocation;
  created: number;
  conflicts: SeasonConflict[];
}
