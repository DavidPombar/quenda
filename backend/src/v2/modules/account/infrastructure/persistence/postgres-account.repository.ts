// SPDX-License-Identifier: AGPL-3.0-or-later
import { Injectable } from "@nestjs/common";
import { Temporal } from "@js-temporal/polyfill";
import { AccountRepository } from "../../domain/account.repository";
import {
  AccountPersonalData,
  AccountProfile,
  ExportedAuditEvent,
  ExportedBlock,
  ExportedBooking,
  ExportedCategory,
  ExportedIdentity,
  ExportedMessage,
  ExportedPushDevice,
  ExportedNotification,
} from "../../domain/account.read-model";
import { Database } from "../../../../shared/infrastructure/database";
import {
  NoticeChannel,
  NoticeKind,
  StoredPreference,
  resolvePreferences,
} from "../../../../shared/application/notice-preferences";
interface BookingRow {
  id: string;
  facilityId: string;
  facilityName: string;
  resourceId: string;
  resourceName: string;
  sport: string;
  start: string;
  end: string;
  status: ExportedBooking["status"];
  createdAt: string;
  cancelledAt: string | null;
  cancelledBy: ExportedBooking["cancelledBy"];
  cancellationReason: string | null;
  checkedInAt: string | null;
  tariffCategory: ExportedBooking["tariffCategory"];
  priceCents: number | null;
}
interface CategoryRow {
  category: ExportedCategory["category"];
  status: ExportedCategory["status"];
  requestedAt: string | null;
  decidedAt: string | null;
}
interface NotificationRow {
  id: string;
  bookingId: string;
  kind: ExportedNotification["kind"];
  facilityName: string;
  resourceId: string;
  resourceName: string;
  createdAt: string;
  details: Record<string, unknown> | null;
}
interface MessageRow {
  id: string;
  kind: ExportedMessage["kind"];
  channel: ExportedMessage["channel"];
  createdAt: string;
  sentAt: string | null;
}
interface AuditRow {
  id: string;
  action: string;
  resourceId: string;
  occurredAt: string;
  details: Record<string, unknown> | null;
}
@Injectable()
export class PostgresAccountRepository extends AccountRepository {
  constructor(private readonly db: Database) {
    super();
  }
  async lockUser(tenantId: string, userId: string) {
    await this.db.query(
      "SELECT id FROM users WHERE tenant_id=$1 AND id=$2 FOR UPDATE",
      [tenantId, userId],
    );
  }
  async find(tenantId: string, userId: string) {
    const { rows } = await this.db.query<AccountProfile>(
      'SELECT id AS "userId", display_name AS "displayName", role, email, locale FROM users WHERE tenant_id=$1 AND id=$2 AND deleted_at IS NULL',
      [tenantId, userId],
    );
    return rows[0] ?? null;
  }
  async findPersonalData(tenantId: string, userId: string) {
    const { rows } = await this.db.query<AccountPersonalData>(
      'SELECT email, assurance, nif_ciphertext AS "nifCiphertext" FROM users WHERE tenant_id=$1 AND id=$2 AND deleted_at IS NULL',
      [tenantId, userId],
    );
    return rows[0] ?? null;
  }
  async countActivity(tenantId: string, userId: string) {
    const { rows } = await this.db.query<{
      bookings: number;
      notifications: number;
    }>(
      "SELECT (SELECT count(*) FROM bookings WHERE tenant_id=$1 AND user_id=$2)::int AS bookings, (SELECT count(*) FROM notifications WHERE tenant_id=$1 AND user_id=$2)::int AS notifications",
      [tenantId, userId],
    );
    return rows[0];
  }
  async markDeleted(
    tenantId: string,
    userId: string,
    displayName: string,
    now: Temporal.Instant,
  ) {
    await this.db.query(
      "UPDATE users SET display_name=$3, deleted_at=$4, prefers_family_tariff=false, email=NULL, locale=NULL, nif_ciphertext=NULL, nif_digest=NULL, organization_id=NULL WHERE tenant_id=$1 AND id=$2",
      [tenantId, userId, displayName, now.toString()],
    );
  }
  async cancelFutureBookings(
    tenantId: string,
    userId: string,
    now: Temporal.Instant,
  ) {
    // Cancelling also frees the occupied units, in the same statement.
    const { rows } = await this.db.query<{ count: number }>(
      `WITH cancelled AS (
        UPDATE bookings SET status='cancelled', cancelled_at=$3, cancelled_by='citizen'
        WHERE tenant_id=$1 AND user_id=$2 AND status='confirmed' AND ends_at>$3 RETURNING id
      ), released AS (
        DELETE FROM booking_units u USING cancelled c WHERE u.tenant_id=$1 AND u.booking_id=c.id
      )
      SELECT count(*)::int AS count FROM cancelled`,
      [tenantId, userId, now.toString()],
    );
    return rows[0].count;
  }
  async deleteNotifications(tenantId: string, userId: string) {
    const { rowCount } = await this.db.query(
      "DELETE FROM notifications WHERE tenant_id=$1 AND user_id=$2",
      [tenantId, userId],
    );
    return rowCount ?? 0;
  }
  async deleteCategories(tenantId: string, userId: string) {
    const { rowCount } = await this.db.query(
      "DELETE FROM user_categories WHERE tenant_id=$1 AND user_id=$2",
      [tenantId, userId],
    );
    return rowCount ?? 0;
  }
  async listCategories(tenantId: string, userId: string) {
    const { rows } = await this.db.query<CategoryRow>(
      'SELECT category, status, requested_at AS "requestedAt", decided_at AS "decidedAt" FROM user_categories WHERE tenant_id=$1 AND user_id=$2 ORDER BY category',
      [tenantId, userId],
    );
    const preference = await this.db.query<{ value: boolean }>(
      "SELECT prefers_family_tariff AS value FROM users WHERE tenant_id=$1 AND id=$2",
      [tenantId, userId],
    );
    const instant = (value: string | null) =>
      value === null ? null : Temporal.Instant.from(value);
    return {
      categories: rows.map((row): ExportedCategory => ({
        ...row,
        requestedAt: instant(row.requestedAt),
        decidedAt: instant(row.decidedAt),
      })),
      prefersFamilyTariff: preference.rows[0]?.value ?? false,
    };
  }
  async deleteMessaging(tenantId: string, userId: string) {
    await this.db.query(
      "DELETE FROM outbox WHERE tenant_id=$1 AND user_id=$2",
      [tenantId, userId],
    );
    await this.db.query(
      "DELETE FROM notification_preferences WHERE tenant_id=$1 AND user_id=$2",
      [tenantId, userId],
    );
    await this.db.query(
      "DELETE FROM push_subscriptions WHERE tenant_id=$1 AND user_id=$2",
      [tenantId, userId],
    );
  }
  async setLocale(tenantId: string, userId: string, locale: "gl" | "es") {
    await this.db.query(
      "UPDATE users SET locale=$3 WHERE tenant_id=$1 AND id=$2",
      [tenantId, userId, locale],
    );
  }
  async findPreferences(tenantId: string, userId: string) {
    const { rows } = await this.db.query<StoredPreference>(
      "SELECT kind, channel, enabled FROM notification_preferences WHERE tenant_id=$1 AND user_id=$2",
      [tenantId, userId],
    );
    return resolvePreferences(rows);
  }
  async preferenceVersion(
    tenantId: string,
    userId: string,
    kind: NoticeKind,
    channel: NoticeChannel,
  ) {
    // Same expression as the delivery query that signs the unsubscribe links.
    const { rows } = await this.db.query<{ version: string }>(
      "SELECT floor(extract(epoch FROM updated_at) * 1000)::bigint::text AS version FROM notification_preferences WHERE tenant_id=$1 AND user_id=$2 AND kind=$3 AND channel=$4",
      [tenantId, userId, kind, channel],
    );
    return rows[0]?.version ?? "0";
  }
  async setPreference(
    tenantId: string,
    userId: string,
    preference: { kind: NoticeKind; channel: NoticeChannel; enabled: boolean },
    now: Temporal.Instant,
  ) {
    await this.db.query(
      "INSERT INTO notification_preferences (tenant_id,user_id,kind,channel,enabled,updated_at) VALUES ($1,$2,$3,$4,$5,$6) ON CONFLICT (tenant_id,user_id,kind,channel) DO UPDATE SET enabled=EXCLUDED.enabled, updated_at=EXCLUDED.updated_at",
      [
        tenantId,
        userId,
        preference.kind,
        preference.channel,
        preference.enabled,
        now.toString(),
      ],
    );
  }
  async savePushDevice(
    args: Parameters<AccountRepository["savePushDevice"]>[0],
  ) {
    await this.db.query(
      `INSERT INTO push_subscriptions (id,tenant_id,user_id,endpoint,p256dh,auth,user_agent,created_at)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
        ON CONFLICT (tenant_id,endpoint) DO UPDATE SET user_id=EXCLUDED.user_id, p256dh=EXCLUDED.p256dh,
          auth=EXCLUDED.auth, user_agent=EXCLUDED.user_agent, created_at=EXCLUDED.created_at`,
      [
        args.id,
        args.tenantId,
        args.userId,
        args.endpoint,
        args.p256dh,
        args.auth,
        args.userAgent,
        args.createdAt.toString(),
      ],
    );
  }
  async removePushDevice(tenantId: string, userId: string, endpoint: string) {
    const { rowCount } = await this.db.query(
      "DELETE FROM push_subscriptions WHERE tenant_id=$1 AND user_id=$2 AND endpoint=$3",
      [tenantId, userId, endpoint],
    );
    return (rowCount ?? 0) > 0;
  }
  async countPushDevices(tenantId: string, userId: string) {
    const { rows } = await this.db.query<{ count: number }>(
      "SELECT count(*)::int AS count FROM push_subscriptions WHERE tenant_id=$1 AND user_id=$2",
      [tenantId, userId],
    );
    return rows[0]?.count ?? 0;
  }
  async listPushDevicesAll(tenantId: string, userId: string) {
    const { rows } = await this.db.query<{
      endpoint: string;
      userAgent: string;
      createdAt: string;
    }>(
      'SELECT endpoint, user_agent AS "userAgent", created_at AS "createdAt" FROM push_subscriptions WHERE tenant_id=$1 AND user_id=$2 ORDER BY created_at',
      [tenantId, userId],
    );
    return rows.map((row): ExportedPushDevice => ({
      service: new URL(row.endpoint).origin,
      userAgent: row.userAgent,
      createdAt: Temporal.Instant.from(row.createdAt),
    }));
  }
  async listMessagesAll(tenantId: string, userId: string) {
    const { rows } = await this.db.query<MessageRow>(
      'SELECT id, kind, channel, created_at AS "createdAt", sent_at AS "sentAt" FROM outbox WHERE tenant_id=$1 AND user_id=$2 ORDER BY created_at DESC',
      [tenantId, userId],
    );
    return rows.map((row): ExportedMessage => ({
      ...row,
      createdAt: Temporal.Instant.from(row.createdAt),
      sentAt: row.sentAt === null ? null : Temporal.Instant.from(row.sentAt),
    }));
  }
  async revokeSessions(tenantId: string, userId: string) {
    await this.db.query(
      "DELETE FROM calendar_feeds WHERE tenant_id=$1 AND user_id=$2",
      [tenantId, userId],
    );
    const { rowCount } = await this.db.query(
      "DELETE FROM sessions WHERE tenant_id=$1 AND user_id=$2",
      [tenantId, userId],
    );
    return rowCount ?? 0;
  }
  async deleteIdentities(tenantId: string, userId: string) {
    // Sign-in codes of an account opened by email are found through its email identity.
    await this.db.query(
      "DELETE FROM login_codes WHERE tenant_id=$1 AND email_hash IN (SELECT subject FROM identities WHERE tenant_id=$1 AND user_id=$2 AND issuer='email')",
      [tenantId, userId],
    );
    const { rowCount } = await this.db.query(
      "DELETE FROM identities WHERE tenant_id=$1 AND user_id=$2",
      [tenantId, userId],
    );
    return rowCount ?? 0;
  }
  async listIdentities(tenantId: string, userId: string) {
    const { rows } = await this.db.query<{
      issuer: string;
      subject: string;
      createdAt: string;
    }>(
      'SELECT issuer, subject, created_at AS "createdAt" FROM identities WHERE tenant_id=$1 AND user_id=$2 ORDER BY created_at',
      [tenantId, userId],
    );
    return rows.map((row): ExportedIdentity => ({
      ...row,
      createdAt: Temporal.Instant.from(row.createdAt),
    }));
  }
  async listBookingsAll(tenantId: string, userId: string) {
    const { rows } = await this.db.query<BookingRow>(
      'SELECT b.id, b.facility_id AS "facilityId", f.name AS "facilityName", b.resource_id AS "resourceId", r.name AS "resourceName", f.sport, b.starts_at AS "start", b.ends_at AS "end", b.status, b.created_at AS "createdAt", b.cancelled_at AS "cancelledAt", b.cancelled_by AS "cancelledBy", b.cancellation_reason AS "cancellationReason", b.tariff_category AS "tariffCategory", b.price_cents AS "priceCents", c.checked_in_at AS "checkedInAt" FROM bookings b JOIN facilities f ON f.tenant_id=b.tenant_id AND f.id=b.facility_id JOIN resources r ON r.tenant_id=b.tenant_id AND r.id=b.resource_id LEFT JOIN check_ins c ON c.tenant_id=b.tenant_id AND c.booking_id=b.id AND c.booking_sequence=b.sequence WHERE b.tenant_id=$1 AND b.user_id=$2 ORDER BY b.starts_at DESC',
      [tenantId, userId],
    );
    return rows.map((row): ExportedBooking => ({
      ...row,
      start: Temporal.Instant.from(row.start),
      end: Temporal.Instant.from(row.end),
      createdAt: Temporal.Instant.from(row.createdAt),
      cancelledAt:
        row.cancelledAt === null
          ? null
          : Temporal.Instant.from(row.cancelledAt),
      checkedInAt:
        row.checkedInAt === null
          ? null
          : Temporal.Instant.from(row.checkedInAt),
    }));
  }
  async listNotificationsAll(tenantId: string, userId: string) {
    const { rows } = await this.db.query<NotificationRow>(
      'SELECT n.id, n.booking_id AS "bookingId", n.kind, n.created_at AS "createdAt", n.details, f.name AS "facilityName", b.resource_id AS "resourceId", r.name AS "resourceName" FROM notifications n JOIN bookings b ON b.id=n.booking_id AND b.tenant_id=n.tenant_id JOIN facilities f ON f.id=b.facility_id AND f.tenant_id=b.tenant_id JOIN resources r ON r.id=b.resource_id AND r.tenant_id=b.tenant_id WHERE n.tenant_id=$1 AND n.user_id=$2 ORDER BY n.created_at DESC',
      [tenantId, userId],
    );
    return rows.map((row): ExportedNotification => ({
      ...row,
      createdAt: Temporal.Instant.from(row.createdAt),
    }));
  }
  async listBlocksAll(tenantId: string, userId: string) {
    const { rows } = await this.db.query<{
      start: string;
      end: string;
      liftedAt: string | null;
    }>(
      'SELECT starts_at AS "start", ends_at AS "end", lifted_at AS "liftedAt" FROM booking_blocks WHERE tenant_id=$1 AND user_id=$2 ORDER BY starts_at DESC',
      [tenantId, userId],
    );
    return rows.map((row): ExportedBlock => ({
      start: Temporal.Instant.from(row.start),
      end: Temporal.Instant.from(row.end),
      liftedAt:
        row.liftedAt === null ? null : Temporal.Instant.from(row.liftedAt),
    }));
  }
  async listAuditByActor(tenantId: string, userId: string) {
    const { rows } = await this.db.query<AuditRow>(
      'SELECT id, action, resource_id AS "resourceId", occurred_at AS "occurredAt", details FROM audit_events WHERE tenant_id=$1 AND actor_id=$2 ORDER BY occurred_at DESC',
      [tenantId, userId],
    );
    return rows.map((row): ExportedAuditEvent => ({
      ...row,
      occurredAt: Temporal.Instant.from(row.occurredAt),
    }));
  }
}
