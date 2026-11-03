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
      "INSERT INTO notifications (id,tenant_id,user_id,booking_id,kind,created_at,details,dedupe_key,waitlist_entry_id,enrolment_id,activity_session_id) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) ON CONFLICT (dedupe_key) WHERE dedupe_key IS NOT NULL DO NOTHING",
      [
        args.id,
        args.tenantId,
        args.userId,
        args.bookingId,
        args.kind,
        args.createdAt.toString(),
        args.details ?? null,
        args.dedupeKey ?? null,
        args.waitlistEntryId ?? null,
        args.enrolmentId ?? null,
        args.activitySessionId ?? null,
      ],
    );
    return (rowCount ?? 0) > 0;
  }
  async list(tenantId: string, userId: string) {
    const { rows } = await this.db.query<
      Omit<Notification, "createdAt"> & { createdAt: string }
    >(
      `SELECT n.id, n.booking_id AS "bookingId", n.kind, n.created_at AS "createdAt", n.details,
        f.name AS "facilityName", r.id AS "resourceId", r.name AS "resourceName",
        a.id AS "activityId", CASE WHEN a.id IS NULL THEN NULL
          ELSE json_build_object('gl', a.name_gl, 'es', a.name_es) END AS "activityName",
        d.first_name AS "participantName"
      FROM notifications n
      LEFT JOIN bookings b ON b.id=n.booking_id AND b.tenant_id=n.tenant_id
      LEFT JOIN waitlist_entries w ON w.id=n.waitlist_entry_id AND w.tenant_id=n.tenant_id
      LEFT JOIN activity_enrolments e ON e.id=n.enrolment_id AND e.tenant_id=n.tenant_id
      LEFT JOIN activities a ON a.id=e.activity_id AND a.tenant_id=n.tenant_id
      LEFT JOIN dependants d ON d.id=e.dependant_id AND d.tenant_id=n.tenant_id
      JOIN facilities f ON f.id=COALESCE(b.facility_id,w.facility_id,a.facility_id) AND f.tenant_id=n.tenant_id
      JOIN resources r ON r.id=COALESCE(b.resource_id,w.resource_id,a.resource_id) AND r.tenant_id=n.tenant_id
      WHERE n.tenant_id=$1 AND n.user_id=$2 ORDER BY n.created_at DESC LIMIT 50`,
      [tenantId, userId],
    );
    return rows.map((row) => ({
      ...row,
      createdAt: Temporal.Instant.from(row.createdAt),
    }));
  }
}
