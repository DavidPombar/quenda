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
    enabledCategories: string[];
    accessibilityUnit: string;
    accessibilityEmail: string;
    accessibilityPhone: string;
    accessibilityReviewedOn: string;
    accessibilityMethod: string;
    accessibilityExceptionsGl: string;
    accessibilityExceptionsEs: string;
    dataLicense: string;
    dir3Code: string | null;
    accessWebhookUrl: string;
    accessWebhookSecretSealed: string | null;
  };
  accessKeys: {
    kid: string;
    publicJwk: Record<string, string>;
    privateKeySealed: string;
    createdAt: Temporal.Instant;
    retiredAt: Temporal.Instant | null;
  }[];
  checkIns: {
    id: string;
    bookingId: string;
    sequence: number;
    actorId: string | null;
    method: string;
    checkedInAt: Temporal.Instant;
    recordedAt: Temporal.Instant;
  }[];
  facilityStatusPeriods: {
    facilityId: string;
    status: string;
    start: Temporal.Instant;
    end: Temporal.Instant | null;
  }[];
  facilityPrices: {
    facilityId: string;
    category: string;
    priceCents: number;
  }[];
  userCategories: {
    userId: string;
    category: string;
    status: string;
    requestedAt: Temporal.Instant | null;
    decidedAt: Temporal.Instant | null;
  }[];
  /** The municipality's sports catalogue, hidden sports included. */
  sports: {
    code: string;
    nameGl: string;
    nameEs: string;
    cnidClass: string;
    cnidType: string;
    schemaType: string;
    art: string;
    visible: boolean;
    position: number;
  }[];
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
    latitude: number | null;
    longitude: number | null;
  }[];
  /** Courts and spaces, parents before their parts. */
  resources: {
    id: string;
    facilityId: string;
    name: string;
    position: number;
    parentId: string | null;
    active: boolean;
    createdAt: Temporal.Instant;
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
    prefersFamilyTariff: boolean;
    /** Club the person represents (#17). */
    organizationId: string | null;
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
    resourceId: string;
    start: Temporal.Instant;
    end: Temporal.Instant;
    status: string;
    createdAt: Temporal.Instant;
    cancelledAt: Temporal.Instant | null;
    cancellationHours: number | null;
    cancelledBy: string | null;
    cancellationReason: string | null;
    sequence: number;
    tariffCategory: string | null;
    priceCents: number | null;
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
  /** Season allocation to clubs (#17). Instants and dates are ISO strings as stored. */
  organizations: {
    id: string;
    name: string;
    taxId: string | null;
    sport: string | null;
    contactEmail: string | null;
    createdAt: string;
    archivedAt: string | null;
  }[];
  seasonCampaigns: {
    id: string;
    name: string;
    startsOn: string;
    endsOn: string;
    criteriaGl: string;
    criteriaEs: string;
    facilityIds: string[];
    createdAt: string;
  }[];
  seasonAllocations: {
    id: string;
    campaignId: string;
    organizationId: string;
    facilityId: string;
    resourceId: string;
    weekdays: number[];
    startsLocal: string;
    endsLocal: string;
    /** Informative RFC 5545 rule; the dated occurrences below are authoritative. */
    rrule: string;
    reason: string;
    createdBy: string | null;
    createdAt: string;
    cancelledAt: string | null;
    cancellationReason: string | null;
  }[];
  seasonOccurrences: {
    id: string;
    allocationId: string;
    start: string;
    end: string;
    status: string;
    conflictBookingId: string | null;
    cancellationReason: string | null;
  }[];
}
export interface MunicipalityExport {
  exportedAt: Temporal.Instant;
  snapshot: MunicipalitySnapshot;
}
