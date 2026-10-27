// SPDX-License-Identifier: AGPL-3.0-or-later
import type { Temporal } from "@js-temporal/polyfill";
import type { Assurance } from "../../../shared/application/principal";
export interface AccountProfile {
  userId: string;
  displayName: string;
  role: "citizen" | "manager";
}
/** Personal data kept on the account row; the NIF arrives here still encrypted. */
export interface AccountPersonalData {
  email: string | null;
  assurance: Assurance;
  nifCiphertext: string | null;
}
export interface ExportedProfile extends AccountProfile {
  email: string | null;
  assurance: Assurance;
  /** Decrypted NIF, or null when none is stored or it cannot be decrypted with the current key. */
  nif: string | null;
}
export interface ExportedIdentity {
  issuer: string;
  subject: string;
  createdAt: Temporal.Instant;
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
  status: "confirmed" | "cancelled";
  createdAt: Temporal.Instant;
  cancelledAt: Temporal.Instant | null;
}
export interface ExportedNotification {
  id: string;
  bookingId: string;
  kind: "confirmed" | "rescheduled" | "cancelled";
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
  profile: ExportedProfile;
  identities: ExportedIdentity[];
  consents: ConsentRecord[];
  bookings: ExportedBooking[];
  notifications: ExportedNotification[];
  auditEvents: ExportedAuditEvent[];
}
