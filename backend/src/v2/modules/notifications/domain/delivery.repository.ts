// SPDX-License-Identifier: AGPL-3.0-or-later
import type { Temporal } from "@js-temporal/polyfill";
import type { Delivery, DueReminder, PushDevice } from "./delivery.read-model";
export abstract class DeliveryRepository {
  /**
   * Confirmed reservations starting within the reminder window that were booked before the
   * window opened and whose person has not been reminded of this start time yet.
   */
  abstract dueReminders(
    tenantId: string,
    now: Temporal.Instant,
    reminderHours: number,
  ): Promise<DueReminder[]>;
  /** Leases pending messages with SKIP LOCKED so concurrent workers never share one. */
  abstract claim(args: {
    now: Temporal.Instant;
    leaseUntil: Temporal.Instant;
    maxAttempts: number;
    limit: number;
  }): Promise<Delivery[]>;
  abstract markSent(
    id: string,
    now: Temporal.Instant,
    note: string | null,
  ): Promise<void>;
  abstract markFailed(
    id: string,
    error: string,
    retryAt: Temporal.Instant,
  ): Promise<void>;
  abstract pushDevices(tenantId: string, userId: string): Promise<PushDevice[]>;
  /** Forgets a device whose push service answered that the subscription no longer exists. */
  abstract forgetPushDevice(tenantId: string, id: string): Promise<void>;
}
