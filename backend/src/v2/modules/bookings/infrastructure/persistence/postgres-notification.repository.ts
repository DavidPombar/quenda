// SPDX-License-Identifier: AGPL-3.0-or-later
import { Injectable } from "@nestjs/common";
import { Temporal } from "@js-temporal/polyfill";
import { Database } from "../../../../shared/infrastructure/database";
import { NotificationRepository } from "../../domain/notification.repository";
import { Notification } from "../../domain/notification.entity";
@Injectable()
export class PostgresNotificationRepository extends NotificationRepository {
  constructor(private readonly db: Database) {
    super();
  }
  async add(args: Parameters<NotificationRepository["add"]>[0]) {
    const { rowCount } = await this.db.query(
      "INSERT INTO notifications (id,tenant_id,user_id,booking_id,kind,created_at,details,dedupe_key) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) ON CONFLICT (dedupe_key) WHERE dedupe_key IS NOT NULL DO NOTHING",
      [
        args.id,
        args.tenantId,
        args.userId,
        args.bookingId,
        args.kind,
        args.createdAt.toString(),
        args.details ?? null,
        args.dedupeKey ?? null,
      ],
    );
    return (rowCount ?? 0) > 0;
  }
  async list(tenantId: string, userId: string) {
    const { rows } = await this.db.query<
      Omit<Notification, "createdAt"> & { createdAt: string }
    >(
      'SELECT n.id,n.booking_id AS "bookingId",n.kind,n.created_at AS "createdAt",n.details,f.name AS "facilityName",b.resource_id AS "resourceId",r.name AS "resourceName" FROM notifications n JOIN bookings b ON b.id=n.booking_id AND b.tenant_id=n.tenant_id JOIN facilities f ON f.id=b.facility_id AND f.tenant_id=b.tenant_id JOIN resources r ON r.id=b.resource_id AND r.tenant_id=b.tenant_id WHERE n.tenant_id=$1 AND n.user_id=$2 ORDER BY n.created_at DESC LIMIT 50',
      [tenantId, userId],
    );
    return rows.map((row) => ({
      ...row,
      createdAt: Temporal.Instant.from(row.createdAt),
    }));
  }
}
