// SPDX-License-Identifier: AGPL-3.0-or-later
import { Injectable } from "@nestjs/common";
import { Temporal } from "@js-temporal/polyfill";
import { Database } from "../../../../shared/infrastructure/database";
import { DeliveryRepository } from "../../domain/delivery.repository";
import { Delivery, DueReminder } from "../../domain/delivery.read-model";
interface DeliveryRow {
  id: string;
  kind: Delivery["kind"];
  channel: Delivery["channel"];
  tenantId: string;
  userId: string;
  bookingId: string;
  attempts: number;
  email: string | null;
  locale: string;
  bookingStatus: Delivery["bookingStatus"];
  slug: string;
  municipalityName: string;
  timezone: string;
  senderName: string;
  replyTo: string;
  facilityName: string;
  facilityAddress: string;
  cancellationReason: string | null;
  start: string;
  end: string;
}
@Injectable()
export class PostgresDeliveryRepository extends DeliveryRepository {
  constructor(private readonly db: Database) {
    super();
  }
  async dueReminders(
    tenantId: string,
    now: Temporal.Instant,
    reminderHours: number,
  ) {
    // The key includes the start so a rescheduled reservation is reminded of its new time.
    const { rows } = await this.db.query<DueReminder>(
      `WITH due AS (
        SELECT b.id AS "bookingId", b.user_id AS "userId",
          'reminder:' || b.id || ':' || to_char(b.starts_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS "dedupeKey"
        FROM bookings b
        JOIN users u ON u.tenant_id=b.tenant_id AND u.id=b.user_id
        WHERE b.tenant_id=$1 AND b.status='confirmed'
          AND b.starts_at > $2::timestamptz
          AND b.starts_at <= $2::timestamptz + make_interval(hours => $3)
          AND b.created_at <= b.starts_at - make_interval(hours => $3)
          AND u.deleted_at IS NULL AND u.email IS NOT NULL
          AND NOT EXISTS (
            SELECT 1 FROM notification_preferences p
            WHERE p.tenant_id=b.tenant_id AND p.user_id=b.user_id
              AND p.kind='reminder' AND p.channel='email' AND NOT p.enabled))
      SELECT * FROM due d WHERE NOT EXISTS (SELECT 1 FROM outbox o WHERE o.dedupe_key=d."dedupeKey")`,
      [tenantId, now.toString(), reminderHours],
    );
    return rows;
  }
  async claim(args: Parameters<DeliveryRepository["claim"]>[0]) {
    const { rows } = await this.db.query<DeliveryRow>(
      `WITH due AS (
        SELECT id FROM outbox
        WHERE sent_at IS NULL AND attempts < $3 AND available_at <= $1
          AND (locked_until IS NULL OR locked_until <= $1)
        ORDER BY available_at LIMIT $4
        FOR UPDATE SKIP LOCKED),
      claimed AS (
        UPDATE outbox o SET locked_until=$2, attempts=o.attempts+1
        FROM due WHERE o.id=due.id RETURNING o.*)
      SELECT c.id, c.kind, c.channel, c.tenant_id AS "tenantId", c.user_id AS "userId",
        c.booking_id AS "bookingId", c.attempts,
        CASE WHEN u.deleted_at IS NULL THEN u.email END AS email,
        COALESCE(u.locale, m.locale) AS locale, b.status AS "bookingStatus",
        m.slug, m.name AS "municipalityName", m.timezone,
        COALESCE(NULLIF(m.mail_sender_name, ''), m.name) AS "senderName",
        COALESCE(NULLIF(m.mail_reply_to, ''), m.contact) AS "replyTo",
        f.name AS "facilityName", f.address AS "facilityAddress",
        b.cancellation_reason AS "cancellationReason",
        b.starts_at AS start, b.ends_at AS "end"
      FROM claimed c
      JOIN users u ON u.tenant_id=c.tenant_id AND u.id=c.user_id
      JOIN municipalities m ON m.id=c.tenant_id
      JOIN bookings b ON b.tenant_id=c.tenant_id AND b.id=c.booking_id
      JOIN facilities f ON f.tenant_id=b.tenant_id AND f.id=b.facility_id`,
      [
        args.now.toString(),
        args.leaseUntil.toString(),
        args.maxAttempts,
        args.limit,
      ],
    );
    return rows.map((row): Delivery => ({
      id: row.id,
      kind: row.kind,
      channel: row.channel,
      tenantId: row.tenantId,
      userId: row.userId,
      bookingId: row.bookingId,
      attempts: row.attempts,
      email: row.email,
      locale: row.locale === "es" ? "es" : "gl",
      bookingStatus: row.bookingStatus,
      municipality: {
        slug: row.slug,
        name: row.municipalityName,
        timezone: row.timezone,
        senderName: row.senderName,
        replyTo: row.replyTo,
      },
      facility: { name: row.facilityName, address: row.facilityAddress },
      cancellationReason: row.cancellationReason,
      start: Temporal.Instant.from(row.start),
      end: Temporal.Instant.from(row.end),
    }));
  }
  async markSent(id: string, now: Temporal.Instant, note: string | null) {
    await this.db.query(
      "UPDATE outbox SET sent_at=$2, locked_until=NULL, last_error=$3 WHERE id=$1",
      [id, now.toString(), note],
    );
  }
  async markFailed(id: string, error: string, retryAt: Temporal.Instant) {
    await this.db.query(
      "UPDATE outbox SET locked_until=NULL, last_error=$2, available_at=$3 WHERE id=$1",
      [id, error, retryAt.toString()],
    );
  }
}
