// SPDX-License-Identifier: AGPL-3.0-or-later
import { Injectable } from "@nestjs/common";
import { Temporal } from "@js-temporal/polyfill";
import { AccountRepository } from "../../domain/account.repository";
import {
  AccountProfile,
  ExportedAuditEvent,
  ExportedBooking,
  ExportedNotification,
} from "../../domain/account.read-model";
import { Database } from "../../../../shared/infrastructure/database";
interface BookingRow {
  id: string;
  facilityId: string;
  facilityName: string;
  sport: string;
  start: string;
  end: string;
  status: "confirmed" | "cancelled";
  createdAt: string;
  cancelledAt: string | null;
}
interface NotificationRow {
  id: string;
  bookingId: string;
  kind: ExportedNotification["kind"];
  facilityName: string;
  createdAt: string;
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
      'SELECT id AS "userId", display_name AS "displayName", role FROM users WHERE tenant_id=$1 AND id=$2 AND deleted_at IS NULL',
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
      "UPDATE users SET display_name=$3, deleted_at=$4 WHERE tenant_id=$1 AND id=$2",
      [tenantId, userId, displayName, now.toString()],
    );
  }
  async cancelFutureBookings(
    tenantId: string,
    userId: string,
    now: Temporal.Instant,
  ) {
    const { rowCount } = await this.db.query(
      "UPDATE bookings SET status='cancelled', cancelled_at=$3 WHERE tenant_id=$1 AND user_id=$2 AND status='confirmed' AND ends_at>$3",
      [tenantId, userId, now.toString()],
    );
    return rowCount ?? 0;
  }
  async deleteNotifications(tenantId: string, userId: string) {
    const { rowCount } = await this.db.query(
      "DELETE FROM notifications WHERE tenant_id=$1 AND user_id=$2",
      [tenantId, userId],
    );
    return rowCount ?? 0;
  }
  async revokeSessions(tenantId: string, userId: string) {
    const { rowCount } = await this.db.query(
      "DELETE FROM sessions WHERE tenant_id=$1 AND user_id=$2",
      [tenantId, userId],
    );
    return rowCount ?? 0;
  }
  async listBookingsAll(tenantId: string, userId: string) {
    const { rows } = await this.db.query<BookingRow>(
      'SELECT b.id, b.facility_id AS "facilityId", f.name AS "facilityName", f.sport, b.starts_at AS "start", b.ends_at AS "end", b.status, b.created_at AS "createdAt", b.cancelled_at AS "cancelledAt" FROM bookings b JOIN facilities f ON f.tenant_id=b.tenant_id AND f.id=b.facility_id WHERE b.tenant_id=$1 AND b.user_id=$2 ORDER BY b.starts_at DESC',
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
    }));
  }
  async listNotificationsAll(tenantId: string, userId: string) {
    const { rows } = await this.db.query<NotificationRow>(
      'SELECT n.id, n.booking_id AS "bookingId", n.kind, n.created_at AS "createdAt", f.name AS "facilityName" FROM notifications n JOIN bookings b ON b.id=n.booking_id AND b.tenant_id=n.tenant_id JOIN facilities f ON f.id=b.facility_id AND f.tenant_id=b.tenant_id WHERE n.tenant_id=$1 AND n.user_id=$2 ORDER BY n.created_at DESC',
      [tenantId, userId],
    );
    return rows.map((row): ExportedNotification => ({
      ...row,
      createdAt: Temporal.Instant.from(row.createdAt),
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
