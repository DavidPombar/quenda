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
    await this.db.query(
      "INSERT INTO notifications VALUES ($1,$2,$3,$4,$5,$6)",
      [
        args.id,
        args.tenantId,
        args.userId,
        args.bookingId,
        args.kind,
        args.createdAt.toString(),
      ],
    );
  }
  async list(tenantId: string, userId: string) {
    const { rows } = await this.db.query<
      Omit<Notification, "createdAt"> & { createdAt: string }
    >(
      'SELECT n.id,n.booking_id AS "bookingId",n.kind,n.created_at AS "createdAt",f.name AS "facilityName" FROM notifications n JOIN bookings b ON b.id=n.booking_id AND b.tenant_id=n.tenant_id JOIN facilities f ON f.id=b.facility_id AND f.tenant_id=b.tenant_id WHERE n.tenant_id=$1 AND n.user_id=$2 ORDER BY n.created_at DESC LIMIT 50',
      [tenantId, userId],
    );
    return rows.map((row) => ({
      ...row,
      createdAt: Temporal.Instant.from(row.createdAt),
    }));
  }
}
