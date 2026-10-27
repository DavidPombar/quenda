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
  legalVersion: string;
  retentionMonths: number;
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
  status: "confirmed" | "cancelled";
}
export interface Notification {
  id: string;
  bookingId: string;
  kind: "confirmed" | "rescheduled" | "cancelled";
  facilityName: string;
  resourceId: string;
  resourceName: string;
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
  bookings: {
    id: string;
    facilityId: string;
    facilityName: string;
    resourceId: string;
    resourceName: string;
    sport: Sport;
    start: string;
    end: string;
    status: "confirmed" | "cancelled";
    createdAt: string;
    cancelledAt: string | null;
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
