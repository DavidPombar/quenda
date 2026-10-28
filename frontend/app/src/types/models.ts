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
/** "general" is the facility's base tariff, paid without a verified category. */
export type TariffCategory = Category | "general";
export interface CategoryPrice {
  category: Category;
  priceCents: number;
}
export interface Tariff {
  category: TariffCategory;
  priceCents: number;
}
export interface UserCategory {
  category: Category;
  status: "requested" | "verified" | "rejected";
  requestedAt: string | null;
  decidedAt: string | null;
}
export interface MyCategories {
  categories: UserCategory[];
  prefersFamilyTariff: boolean;
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
  /** Current privacy notice in each language. */
  legalTexts: { gl: string; es: string };
  legalVersion: string;
  retentionMonths: number;
  accessibility: Accessibility;
  reminderHours: number;
  primaryColor: string;
  logoUrl: string | null;
  enabledCategories: Category[];
  /** No-shows within the window that block new bookings; 0 disables the penalty. */
  noShowLimit: number;
  noShowWindowDays: number;
  noShowBlockDays: number;
  /** SPDX identifier of the licence of the municipality's open data. */
  dataLicense: "CC-BY-4.0" | "CC-BY-SA-4.0" | "CC0-1.0" | "ODbL-1.0";
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
  prices: CategoryPrice[];
  openingCalendar: string;
  rules: string;
  resources: Resource[];
}
/** A bookable court or space; parts point to their composite through parentId. */
export interface Resource {
  id: string;
  name: string;
  parentId: string | null;
  active: boolean;
  position: number;
}
export interface Slot {
  start: string;
  end: string;
  status: "available" | "booked" | "past";
}
export interface ResourceAvailability {
  id: string;
  name: string;
  parentId: string | null;
  active: boolean;
  slots: Slot[];
}
export interface Availability {
  resources: ResourceAvailability[];
}
export interface Booking {
  id: string;
  facilityId: string;
  facilityName: string;
  resourceId: string;
  resourceName: string;
  sport: Sport;
  start: string;
  end: string;
  tariffCategory: TariffCategory | null;
  priceCents: number | null;
  status: "confirmed" | "cancelled" | "no_show";
  /** A confirmed booking that has ended counts as attended. */
  outcome: "upcoming" | "attended" | "no_show" | "cancelled";
  cancelledBy: "citizen" | "municipality" | null;
  cancellationReason: string | null;
}
/** No-shows against the municipal penalty; blockedUntil is set while bookings are blocked. */
export interface PenaltyStanding {
  enabled: boolean;
  count: number;
  limit: number;
  windowDays: number;
  blockDays: number;
  remaining: number;
  blockedUntil: string | null;
}
export interface Notification {
  id: string;
  bookingId: string;
  kind:
    | "confirmed"
    | "rescheduled"
    | "cancelled"
    | "cancelled_by_municipality"
    | "no_show"
    | "blocked"
    | "unblocked"
    | "reminder";
  facilityName: string;
  resourceId: string;
  resourceName: string;
  createdAt: string;
  details: {
    reason?: string;
    standing?: Omit<PenaltyStanding, "enabled">;
  } | null;
}
export interface CalendarFeed {
  active: boolean;
  createdAt: string | null;
}
export interface CalendarFeedLink {
  path: string;
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
export interface Consent {
  legalVersion: string;
  acceptedAt: string;
}
export interface Account {
  userId: string;
  displayName: string;
  role: "citizen" | "manager";
  currentLegalVersion: string;
  consentUpToDate: boolean;
  consents: Consent[];
  bookings: number;
  notifications: number;
  email: string | null;
  locale: Locale | null;
  reminderEmails: boolean;
}
export interface AccountExport {
  generatedAt: string;
  municipality: {
    slug: string;
    name: string;
    contact: string;
    legalVersion: string;
    retentionMonths: number;
  };
  profile: { userId: string; displayName: string; role: "citizen" | "manager" };
  consents: Consent[];
  categories: UserCategory[];
  prefersFamilyTariff: boolean;
  bookings: {
    id: string;
    facilityId: string;
    facilityName: string;
    resourceId: string;
    resourceName: string;
    sport: Sport;
    start: string;
    end: string;
    status: Booking["status"];
    createdAt: string;
    cancelledAt: string | null;
    tariffCategory: TariffCategory | null;
    priceCents: number | null;
    cancelledBy: Booking["cancelledBy"];
    cancellationReason: string | null;
  }[];
  notifications: {
    id: string;
    bookingId: string;
    kind: Notification["kind"];
    createdAt: string;
    details: Notification["details"];
  }[];
  blocks: { start: string; end: string; liftedAt: string | null }[];
  auditEvents: {
    id: string;
    action: string;
    resourceId: string;
    occurredAt: string;
    details: Record<string, unknown> | null;
  }[];
}
/** Signed QR pass for one reservation, verifiable at the door without a network. */
export interface AccessPass {
  token: string;
  code: string;
  validFrom: string;
  validUntil: string;
}
export interface CatalogEntry {
  id: string;
  name: string;
  sport: Sport;
  address: string;
  description: string;
  accessible: boolean;
  slotMinutes: number;
  priceCents: number;
  municipality: { slug: string; name: string };
}
export interface CatalogFilters {
  q: string;
  sport: Sport | "";
  accessible: boolean;
  municipalities: string[];
}
export interface AuthMethods {
  demo: boolean;
  oidc: { label: string } | null;
  email: boolean;
}
