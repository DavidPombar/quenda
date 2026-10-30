// SPDX-License-Identifier: AGPL-3.0-or-later
import type { Temporal } from "@js-temporal/polyfill";
import type {
  Category,
  TariffCategory,
} from "../../../shared/application/categories";
import type { Assurance } from "../../../shared/application/principal";
import type {
  MessageChannel,
  MessageKind,
} from "../../../shared/application/outbox";
import type { NoticePreferences } from "../../../shared/application/notice-preferences";
export interface AccountProfile {
  userId: string;
  displayName: string;
  role: "citizen" | "manager";
  /** Optional address for email notices. */
  email: string | null;
  /** Language for outgoing messages; NULL until the person picks one. */
  locale: "gl" | "es" | null;
}
/** The person's notice choices and how many devices receive push notices. */
export interface NotificationSettings {
  preferences: NoticePreferences;
  push: {
    /** Whether the deployment has VAPID keys, so devices can subscribe. */
    available: boolean;
    publicKey: string | null;
    devices: number;
  };
}
/** A device receiving push notices; the endpoint itself is a credential and is not exported. */
export interface ExportedPushDevice {
  /** Origin of the browser's push service, e.g. https://fcm.googleapis.com. */
  service: string;
  userAgent: string;
  createdAt: Temporal.Instant;
}
export interface ExportedMessage {
  id: string;
  kind: MessageKind;
  channel: MessageChannel;
  createdAt: Temporal.Instant;
  sentAt: Temporal.Instant | null;
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
  resourceId: string;
  resourceName: string;
  sport: string;
  start: Temporal.Instant;
  end: Temporal.Instant;
  status: "confirmed" | "cancelled" | "no_show";
  createdAt: Temporal.Instant;
  cancelledAt: Temporal.Instant | null;
  cancelledBy: "citizen" | "municipality" | null;
  cancellationReason: string | null;
  /** When access staff let the person in, if they did. */
  checkedInAt: Temporal.Instant | null;
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
  profile: ExportedProfile;
  identities: ExportedIdentity[];
  consents: ConsentRecord[];
  categories: ExportedCategory[];
  prefersFamilyTariff: boolean;
  bookings: ExportedBooking[];
  notifications: ExportedNotification[];
  preferences: NoticePreferences;
  pushDevices: ExportedPushDevice[];
  messages: ExportedMessage[];
  blocks: ExportedBlock[];
  auditEvents: ExportedAuditEvent[];
}
