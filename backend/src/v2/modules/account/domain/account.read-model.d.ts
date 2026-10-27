// SPDX-License-Identifier: AGPL-3.0-or-later
import type { Temporal } from "@js-temporal/polyfill";
export interface AccountProfile {
  userId: string;
  displayName: string;
  role: "citizen" | "manager";
  /** Optional address for email notices. */
  email: string | null;
  /** Language for outgoing messages; NULL until the person picks one. */
  locale: "gl" | "es" | null;
}
export interface NotificationPreferences {
  reminderEmails: boolean;
}
export interface ExportedMessage {
  id: string;
  kind: "confirmed" | "rescheduled" | "cancelled" | "reminder";
  channel: "email";
  createdAt: Temporal.Instant;
  sentAt: Temporal.Instant | null;
}
export interface ConsentRecord {
  legalVersion: string;
  acceptedAt: Temporal.Instant;
}
export interface AccountSummary {
  profile: AccountProfile;
  currentLegalVersion: string;
  consentUpToDate: boolean;
  consents: ConsentRecord[];
  bookings: number;
  notifications: number;
  preferences: NotificationPreferences;
}
export interface ExportedBooking {
  id: string;
  facilityId: string;
  facilityName: string;
  sport: string;
  start: Temporal.Instant;
  end: Temporal.Instant;
  status: "confirmed" | "cancelled";
  createdAt: Temporal.Instant;
  cancelledAt: Temporal.Instant | null;
}
export interface ExportedNotification {
  id: string;
  bookingId: string;
  kind: "confirmed" | "rescheduled" | "cancelled" | "reminder";
  facilityName: string;
  createdAt: Temporal.Instant;
}
export interface ExportedAuditEvent {
  id: string;
  action: string;
  resourceId: string;
  occurredAt: Temporal.Instant;
  details: Record<string, unknown> | null;
}
export interface AccountExport {
  generatedAt: Temporal.Instant;
  municipality: {
    slug: string;
    name: string;
    contact: string;
    legalVersion: string;
    retentionMonths: number;
  };
  profile: AccountProfile;
  consents: ConsentRecord[];
  bookings: ExportedBooking[];
  notifications: ExportedNotification[];
  preferences: NotificationPreferences;
  messages: ExportedMessage[];
  auditEvents: ExportedAuditEvent[];
}
