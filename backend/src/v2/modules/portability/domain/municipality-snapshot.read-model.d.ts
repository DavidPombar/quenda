// SPDX-License-Identifier: AGPL-3.0-or-later
import type { Temporal } from "@js-temporal/polyfill";
import type { MunicipalitySettings } from "../../../shared/application/municipality-settings";
/** Everything a municipality owns, as one consistent read (criterion 4, T3). */
export interface MunicipalitySnapshot {
  municipality: MunicipalitySettings;
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
  }[];
  /** Minimum account data; sessions and credentials are never exported. */
  users: { id: string; displayName: string; role: string }[];
  bookings: {
    id: string;
    userId: string;
    facilityId: string;
    start: Temporal.Instant;
    end: Temporal.Instant;
    status: string;
    createdAt: Temporal.Instant;
    cancelledAt: Temporal.Instant | null;
  }[];
  notifications: {
    id: string;
    userId: string;
    bookingId: string;
    kind: string;
    createdAt: Temporal.Instant;
  }[];
  auditEvents: {
    id: string;
    actorId: string;
    action: string;
    resourceId: string;
    occurredAt: Temporal.Instant;
  }[];
}
export interface MunicipalityExport {
  exportedAt: Temporal.Instant;
  snapshot: MunicipalitySnapshot;
}
