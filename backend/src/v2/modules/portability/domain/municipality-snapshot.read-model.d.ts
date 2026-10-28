// SPDX-License-Identifier: AGPL-3.0-or-later
import type { Temporal } from "@js-temporal/polyfill";
/** A consistent municipal snapshot, excluding sessions and subscription credentials (T3, T4, R3). */
export interface MunicipalitySnapshot {
  municipality: {
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
    primaryColor: string;
    holidaysCalendar: string;
    noShowLimit: number;
    noShowWindowDays: number;
    noShowBlockDays: number;
    reminderHours: number;
    mailSenderName: string;
    mailReplyTo: string;
    storeNif: boolean;
  };
  facilities: {
    id: string;
    name: string;
    sport: string;
    address: string;
    description: string;
    accessible: boolean;
    status: string;
    slotMinutes: number;
    priceCents: number;
    openingCalendar: string;
    rules: string;
    followsMunicipalHolidays: boolean;
  }[];
  users: {
    id: string;
    displayName: string;
    role: string;
    deletedAt: Temporal.Instant | null;
    email: string | null;
    locale: string | null;
    assurance: string;
    /** Encrypted as stored: readable only with the same QUENDA_DATA_KEY. */
    nifCiphertext: string | null;
    nifDigest: string | null;
  }[];
  /** Links to the identity provider (issuer and subject), so people keep their account. */
  identities: {
    id: string;
    userId: string;
    issuer: string;
    subject: string;
    createdAt: Temporal.Instant;
  }[];
  bookings: {
    id: string;
    userId: string | null;
    facilityId: string;
    start: Temporal.Instant;
    end: Temporal.Instant;
    status: string;
    createdAt: Temporal.Instant;
    cancelledAt: Temporal.Instant | null;
    cancellationHours: number | null;
    cancelledBy: string | null;
    cancellationReason: string | null;
    sequence: number;
  }[];
  notifications: {
    id: string;
    userId: string;
    bookingId: string;
    kind: string;
    createdAt: Temporal.Instant;
    details: Record<string, unknown> | null;
  }[];
  auditEvents: {
    id: string;
    actorId: string | null;
    action: string;
    resourceId: string;
    occurredAt: Temporal.Instant;
    actorRole: string | null;
    details: Record<string, unknown> | null;
  }[];
  consents: {
    id: string;
    userId: string;
    legalVersion: string;
    acceptedAt: Temporal.Instant;
  }[];
  legalTexts: {
    version: string;
    textGl: string;
    textEs: string;
    publishedAt: Temporal.Instant;
  }[];
  logos: {
    contentType: string;
    data: string;
    sha256: string;
    updatedAt: Temporal.Instant;
  }[];
  bookingBlocks: {
    id: string;
    userId: string;
    bookingId: string;
    start: Temporal.Instant;
    end: Temporal.Instant;
    liftedAt: Temporal.Instant | null;
  }[];
  notificationPreferences: {
    userId: string;
    kind: string;
    channel: string;
    enabled: boolean;
    updatedAt: Temporal.Instant;
  }[];
  messages: {
    id: string;
    userId: string;
    bookingId: string;
    kind: string;
    channel: string;
    dedupeKey: string;
    createdAt: Temporal.Instant;
    availableAt: Temporal.Instant;
    attempts: number;
    lockedUntil: Temporal.Instant | null;
    sentAt: Temporal.Instant | null;
    lastError: string | null;
  }[];
}
export interface MunicipalityExport {
  exportedAt: Temporal.Instant;
  snapshot: MunicipalitySnapshot;
}
