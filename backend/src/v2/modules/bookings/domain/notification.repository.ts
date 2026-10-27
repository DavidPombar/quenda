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
  }): Promise<void>;
  abstract list(tenantId: string, userId: string): Promise<Notification[]>;
}
