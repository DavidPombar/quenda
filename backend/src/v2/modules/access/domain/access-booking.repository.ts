// SPDX-License-Identifier: AGPL-3.0-or-later
import type { Temporal } from "@js-temporal/polyfill";
export interface AccessBooking {
  id: string;
  tenantId: string;
  userId: string;
  displayName: string;
  facilityId: string;
  facilityName: string;
  openingCalendar: string;
  start: Temporal.Instant;
  end: Temporal.Instant;
  status: "confirmed" | "no_show" | "cancelled";
  checkedInAt: Temporal.Instant | null;
}
export abstract class AccessBookingRepository {
  /** Any person's booking in the tenant; the row is locked when `lock` is set. */
  abstract find(
    tenantId: string,
    id: string,
    lock?: boolean,
  ): Promise<AccessBooking | null>;
  abstract checkIn(args: {
    tenantId: string;
    id: string;
    at: Temporal.Instant;
    by: string;
  }): Promise<void>;
}
