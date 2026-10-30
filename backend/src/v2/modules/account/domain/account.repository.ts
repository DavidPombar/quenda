// SPDX-License-Identifier: AGPL-3.0-or-later
import type { Temporal } from "@js-temporal/polyfill";
import type {
  AccountPersonalData,
  AccountProfile,
  ExportedAuditEvent,
  ExportedBlock,
  ExportedBooking,
  ExportedCategory,
  ExportedIdentity,
  ExportedMessage,
  ExportedNotification,
  ExportedPushDevice,
} from "./account.read-model";
import type {
  NoticeChannel,
  NoticeKind,
  NoticePreferences,
} from "../../../shared/application/notice-preferences";
export abstract class AccountRepository {
  abstract lockUser(tenantId: string, userId: string): Promise<void>;
  abstract find(
    tenantId: string,
    userId: string,
  ): Promise<AccountProfile | null>;
  abstract findPersonalData(
    tenantId: string,
    userId: string,
  ): Promise<AccountPersonalData | null>;
  abstract countActivity(
    tenantId: string,
    userId: string,
  ): Promise<{ bookings: number; notifications: number }>;
  /**
   * Anonymises the row in place (display name, e-mail and NIF); history keeps referencing it
   * without personal data.
   */
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
  /** Removes queued and delivered messages, notice preferences and push devices. */
  abstract deleteMessaging(tenantId: string, userId: string): Promise<void>;
  abstract setLocale(
    tenantId: string,
    userId: string,
    locale: "gl" | "es",
  ): Promise<void>;
  /** Stored choices over the defaults. */
  abstract findPreferences(
    tenantId: string,
    userId: string,
  ): Promise<NoticePreferences>;
  /** When one choice last changed, in epoch milliseconds; "0" when it was never stored. */
  abstract preferenceVersion(
    tenantId: string,
    userId: string,
    kind: NoticeKind,
    channel: NoticeChannel,
  ): Promise<string>;
  abstract setPreference(
    tenantId: string,
    userId: string,
    preference: { kind: NoticeKind; channel: NoticeChannel; enabled: boolean },
    now: Temporal.Instant,
  ): Promise<void>;
  /** Adds the device, or moves it to this person when the browser was used by someone else. */
  abstract savePushDevice(args: {
    id: string;
    tenantId: string;
    userId: string;
    endpoint: string;
    p256dh: string;
    auth: string;
    userAgent: string;
    createdAt: Temporal.Instant;
  }): Promise<void>;
  /** Returns false when the person had no such device. */
  abstract removePushDevice(
    tenantId: string,
    userId: string,
    endpoint: string,
  ): Promise<boolean>;
  abstract countPushDevices(tenantId: string, userId: string): Promise<number>;
  abstract listPushDevicesAll(
    tenantId: string,
    userId: string,
  ): Promise<ExportedPushDevice[]>;
  abstract listMessagesAll(
    tenantId: string,
    userId: string,
  ): Promise<ExportedMessage[]>;
  abstract revokeSessions(tenantId: string, userId: string): Promise<number>;
  /** Unlinks every external identity so the person can no longer sign in to this account. */
  abstract deleteIdentities(tenantId: string, userId: string): Promise<number>;
  abstract listIdentities(
    tenantId: string,
    userId: string,
  ): Promise<ExportedIdentity[]>;
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
