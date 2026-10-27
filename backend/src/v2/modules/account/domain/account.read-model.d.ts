// SPDX-License-Identifier: AGPL-3.0-or-later
import type { Temporal } from "@js-temporal/polyfill";
import type {
  Category,
  TariffCategory,
} from "../../../shared/application/categories";
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
  status: "confirmed" | "cancelled";
  createdAt: Temporal.Instant;
  cancelledAt: Temporal.Instant | null;
  tariffCategory: TariffCategory | null;
  priceCents: number | null;
}
export interface ExportedCategory {
  category: Category;
  status: "requested" | "verified" | "rejected";
  requestedAt: Temporal.Instant | null;
  decidedAt: Temporal.Instant | null;
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
  profile: AccountProfile;
  consents: ConsentRecord[];
  categories: ExportedCategory[];
  prefersFamilyTariff: boolean;
  bookings: ExportedBooking[];
  notifications: ExportedNotification[];
  auditEvents: ExportedAuditEvent[];
}
