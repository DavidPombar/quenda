// SPDX-License-Identifier: AGPL-3.0-or-later
import type { Temporal } from "@js-temporal/polyfill";
import type {
  AccountProfile,
  ExportedAuditEvent,
  ExportedBlock,
  ExportedBooking,
  ExportedMessage,
  ExportedNotification,
  NotificationPreferences,
} from "./account.read-model";
export abstract class AccountRepository {
  abstract lockUser(tenantId: string, userId: string): Promise<void>;
  abstract find(
    tenantId: string,
    userId: string,
  ): Promise<AccountProfile | null>;
  abstract countActivity(
    tenantId: string,
    userId: string,
  ): Promise<{ bookings: number; notifications: number }>;
  /** Anonymises the row in place; history keeps referencing it without personal data. */
  abstract markDeleted(
    tenantId: string,
    userId: string,
    displayName: string,
    now: Temporal.Instant,
  ): Promise<void>;
  /** Returns the number of confirmed reservations that were still ahead. */
  abstract cancelFutureBookings(
    tenantId: string,
    userId: string,
    now: Temporal.Instant,
  ): Promise<number>;
  abstract deleteNotifications(
    tenantId: string,
    userId: string,
  ): Promise<number>;
  /** Removes queued and delivered messages and notice preferences. */
  abstract deleteMessaging(tenantId: string, userId: string): Promise<void>;
  abstract setLocale(
    tenantId: string,
    userId: string,
    locale: "gl" | "es",
  ): Promise<void>;
  abstract findPreferences(
    tenantId: string,
    userId: string,
  ): Promise<NotificationPreferences>;
  abstract setReminderEmails(
    tenantId: string,
    userId: string,
    enabled: boolean,
    now: Temporal.Instant,
  ): Promise<void>;
  abstract listMessagesAll(
    tenantId: string,
    userId: string,
  ): Promise<ExportedMessage[]>;
  abstract revokeSessions(tenantId: string, userId: string): Promise<number>;
  abstract listBookingsAll(
    tenantId: string,
    userId: string,
  ): Promise<ExportedBooking[]>;
  abstract listNotificationsAll(
    tenantId: string,
    userId: string,
  ): Promise<ExportedNotification[]>;
  /** Temporary booking bans after repeated no-shows. */
  abstract listBlocksAll(
    tenantId: string,
    userId: string,
  ): Promise<ExportedBlock[]>;
  abstract listAuditByActor(
    tenantId: string,
    userId: string,
  ): Promise<ExportedAuditEvent[]>;
}
