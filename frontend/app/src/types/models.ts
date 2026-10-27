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
  primaryColor: string;
  logoUrl: string | null;
  enabledCategories: Category[];
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
  tariffCategory: TariffCategory | null;
  priceCents: number | null;
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
    sport: Sport;
    start: string;
    end: string;
    status: "confirmed" | "cancelled";
    createdAt: string;
    cancelledAt: string | null;
    tariffCategory: TariffCategory | null;
    priceCents: number | null;
  }[];
  notifications: {
    id: string;
    bookingId: string;
    kind: Notification["kind"];
    createdAt: string;
  }[];
  auditEvents: {
    id: string;
    action: string;
    resourceId: string;
    occurredAt: string;
    details: Record<string, unknown> | null;
  }[];
}
