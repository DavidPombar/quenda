// SPDX-License-Identifier: AGPL-3.0-or-later
import type { Temporal } from "@js-temporal/polyfill";
import type {
  AccountProfile,
  ExportedAuditEvent,
  ExportedBooking,
  ExportedCategory,
  ExportedNotification,
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
  /** Category records go with the account: they can reveal special-category data (GDPR art. 9). */
  abstract deleteCategories(tenantId: string, userId: string): Promise<number>;
  abstract listCategories(
    tenantId: string,
    userId: string,
  ): Promise<{ categories: ExportedCategory[]; prefersFamilyTariff: boolean }>;
  abstract revokeSessions(tenantId: string, userId: string): Promise<number>;
  abstract listBookingsAll(
    tenantId: string,
    userId: string,
  ): Promise<ExportedBooking[]>;
  abstract listNotificationsAll(
    tenantId: string,
    userId: string,
  ): Promise<ExportedNotification[]>;
  abstract listAuditByActor(
    tenantId: string,
    userId: string,
  ): Promise<ExportedAuditEvent[]>;
}
