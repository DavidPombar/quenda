// SPDX-License-Identifier: AGPL-3.0-or-later
import type { Temporal } from "@js-temporal/polyfill";
import type { Notification, NotificationDetails } from "./notification.entity";
export abstract class NotificationRepository {
  abstract add(args: {
    id: string;
    tenantId: string;
    userId: string;
    bookingId: string;
    kind: Notification["kind"];
    createdAt: Temporal.Instant;
    details?: NotificationDetails;
    /** Makes the notice unique; returns false when one with the same key already exists. */
    dedupeKey?: string;
  }): Promise<boolean>;
  abstract list(tenantId: string, userId: string): Promise<Notification[]>;
}
