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
  /** Current privacy notice in each language. */
  legalTexts: { gl: string; es: string };
  legalVersion: string;
  retentionMonths: number;
  reminderHours: number;
  primaryColor: string;
  logoUrl: string | null;
  /** No-shows within the window that block new bookings; 0 disables the penalty. */
  noShowLimit: number;
  noShowWindowDays: number;
  noShowBlockDays: number;
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
  bookings: {
    id: string;
    facilityId: string;
    facilityName: string;
    sport: Sport;
    start: string;
    end: string;
    status: Booking["status"];
    createdAt: string;
    cancelledAt: string | null;
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
export interface AuthMethods {
  demo: boolean;
  oidc: { label: string } | null;
  email: boolean;
}
