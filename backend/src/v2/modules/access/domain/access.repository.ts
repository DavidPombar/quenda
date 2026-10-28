// SPDX-License-Identifier: AGPL-3.0-or-later
import type { Temporal } from "@js-temporal/polyfill";
import type { AccessDayBooking, PassTarget } from "./access.read-model";
export abstract class AccessRepository {
  abstract passTarget(
    tenantId: string,
    userId: string,
    bookingId: string,
  ): Promise<PassTarget | null>;
  /** Reservations starting in [from, to), any status, with their check-in. */
  abstract day(
    tenantId: string,
    from: Temporal.Instant,
    to: Temporal.Instant,
  ): Promise<
    (Omit<AccessDayBooking, "validFrom"> & { openingCalendar: string })[]
  >;
  abstract findForCheckIn(
    tenantId: string,
    bookingId: string,
  ): Promise<{
    status: PassTarget["status"];
    sequence: number;
    openingCalendar: string;
    start: Temporal.Instant;
    end: Temporal.Instant;
  } | null>;
  /** Returns false when the reservation already had a check-in. */
  abstract addCheckIn(args: {
    id: string;
    tenantId: string;
    bookingId: string;
    sequence: number;
    actorId: string;
    method: "qr" | "manual";
    checkedInAt: Temporal.Instant;
    recordedAt: Temporal.Instant;
  }): Promise<boolean>;
  abstract webhook(
    tenantId: string,
  ): Promise<{ url: string; secretSealed: string | null }>;
  abstract setWebhook(
    tenantId: string,
    url: string,
    secretSealed: string | null,
  ): Promise<void>;
}
