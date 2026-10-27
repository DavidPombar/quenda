// SPDX-License-Identifier: AGPL-3.0-or-later
import type { Temporal } from "@js-temporal/polyfill";
export interface AccountProfile {
  userId: string;
  displayName: string;
  role: "citizen" | "manager";
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
}
export interface ExportedBooking {
  id: string;
  facilityId: string;
  facilityName: string;
  sport: string;
  start: Temporal.Instant;
  end: Temporal.Instant;
  status: "confirmed" | "cancelled" | "no_show";
  createdAt: Temporal.Instant;
  cancelledAt: Temporal.Instant | null;
  cancelledBy: "citizen" | "municipality" | null;
  cancellationReason: string | null;
}
export interface ExportedNotification {
  id: string;
  bookingId: string;
  kind:
    | "confirmed"
    | "rescheduled"
    | "cancelled"
    | "cancelled_by_municipality"
    | "no_show"
    | "blocked"
    | "unblocked";
  facilityName: string;
  createdAt: Temporal.Instant;
  details: Record<string, unknown> | null;
}
export interface ExportedBlock {
  start: Temporal.Instant;
  end: Temporal.Instant;
  liftedAt: Temporal.Instant | null;
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
  blocks: ExportedBlock[];
  auditEvents: ExportedAuditEvent[];
}
