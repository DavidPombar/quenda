// SPDX-License-Identifier: AGPL-3.0-or-later
import { Injectable } from "@nestjs/common";
import { Temporal } from "@js-temporal/polyfill";
import { Database } from "../../../../shared/infrastructure/database";
import { DeliveryRepository } from "../../domain/delivery.repository";
import {
  Delivery,
  DueReminder,
  PenaltyStanding,
  PushDevice,
} from "../../domain/delivery.read-model";
import { noticeKindOf } from "../../../../shared/application/notice-preferences";
import { messageKinds } from "../../../../shared/application/outbox";
// Message kind → notice kind, as a JSON object the claim query looks the preference up with.
const noticeKinds = JSON.stringify(
  Object.fromEntries(messageKinds.map((kind) => [kind, noticeKindOf(kind)])),
);
interface DeliveryRow {
  id: string;
  kind: Delivery["kind"];
  channel: Delivery["channel"];
  tenantId: string;
  userId: string;
  bookingId: string | null;
  waitlistEntryId: string | null;
  enrolmentId: string | null;
  activityNameGl: string | null;
  activityNameEs: string | null;
  enrolmentStatus: Delivery["enrolmentStatus"];
  noticeDetails: { reason?: string; dates?: string[] } | null;
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
  preference: boolean | null;
  preferenceVersion: string;
  standing: PenaltyStanding | null;
  webhookUrl: string;
  webhookSecretSealed: string | null;
  facilityId: string;
  openingCalendar: string;
  start: string;
  end: string;
  offerExpiresAt: string | null;
  offerOpen: boolean;
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
          AND u.deleted_at IS NULL)
      -- Reminders queued before the in-app marker existed used the same key in the outbox.
      SELECT * FROM due d
      WHERE NOT EXISTS (SELECT 1 FROM notifications n WHERE n.dedupe_key=d."dedupeKey")
        AND NOT EXISTS (SELECT 1 FROM outbox o WHERE o.dedupe_key=d."dedupeKey")`,
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
        c.booking_id AS "bookingId", c.waitlist_entry_id AS "waitlistEntryId", c.attempts,
        c.enrolment_id AS "enrolmentId", a.name_gl AS "activityNameGl", a.name_es AS "activityNameEs",
        e.status AS "enrolmentStatus",
        (SELECT n.details FROM notifications n
          WHERE n.tenant_id=c.tenant_id AND n.enrolment_id=c.enrolment_id AND n.kind=c.kind
            AND n.activity_session_id IS NOT DISTINCT FROM c.activity_session_id
          ORDER BY n.created_at DESC LIMIT 1) AS "noticeDetails",
        CASE WHEN u.deleted_at IS NULL THEN u.email END AS email,
        COALESCE(u.locale, m.locale) AS locale, b.status AS "bookingStatus",
        m.slug, m.name AS "municipalityName", m.timezone,
        COALESCE(NULLIF(m.mail_sender_name, ''), m.name) AS "senderName",
        COALESCE(NULLIF(m.mail_reply_to, ''), m.contact) AS "replyTo",
        f.name AS "facilityName", f.address AS "facilityAddress",
        b.cancellation_reason AS "cancellationReason",
        p.enabled AS preference,
        COALESCE(floor(extract(epoch FROM p.updated_at) * 1000)::bigint::text, '0') AS "preferenceVersion",
        (SELECT n.details->'standing' FROM notifications n
          WHERE n.tenant_id=c.tenant_id AND n.booking_id=c.booking_id AND n.kind=c.kind
          ORDER BY n.created_at DESC LIMIT 1) AS standing,
        m.access_webhook_url AS "webhookUrl", m.access_webhook_secret_sealed AS "webhookSecretSealed",
        f.id AS "facilityId", f.opening_calendar AS "openingCalendar",
        COALESCE(b.starts_at, w.starts_at, x.starts_at, c.created_at) AS start,
        COALESCE(b.ends_at, w.ends_at, x.ends_at, c.created_at) AS "end",
        w.offer_expires_at AS "offerExpiresAt",
        (w.status='offered' AND w.offer_expires_at > $1) IS TRUE AS "offerOpen"
      FROM claimed c
      JOIN users u ON u.tenant_id=c.tenant_id AND u.id=c.user_id
      JOIN municipalities m ON m.id=c.tenant_id
      LEFT JOIN bookings b ON b.tenant_id=c.tenant_id AND b.id=c.booking_id
      LEFT JOIN waitlist_entries w ON w.tenant_id=c.tenant_id AND w.id=c.waitlist_entry_id
      LEFT JOIN activity_enrolments e ON e.tenant_id=c.tenant_id AND e.id=c.enrolment_id
      LEFT JOIN activities a ON a.tenant_id=e.tenant_id AND a.id=e.activity_id
      -- An enrolment notice is about its cancelled date, else the next session, else the last one.
      LEFT JOIN LATERAL (
        SELECT s.starts_at, s.ends_at FROM activity_sessions s
        WHERE a.id IS NOT NULL AND s.tenant_id=a.tenant_id AND s.activity_id=a.id
          AND (c.activity_session_id IS NULL OR s.id=c.activity_session_id)
        ORDER BY (c.activity_session_id IS NULL AND s.status='active' AND s.starts_at>$1) DESC,
          CASE WHEN s.starts_at>$1 THEN s.starts_at END ASC, s.starts_at DESC
        LIMIT 1) x ON true
      JOIN facilities f ON f.tenant_id=c.tenant_id AND f.id=COALESCE(b.facility_id, w.facility_id, a.facility_id)
      LEFT JOIN notification_preferences p ON p.tenant_id=c.tenant_id AND p.user_id=c.user_id
        AND p.channel=c.channel AND p.kind=($5::jsonb ->> c.kind)`,
      [
        args.now.toString(),
        args.leaseUntil.toString(),
        args.maxAttempts,
        args.limit,
        noticeKinds,
      ],
    );
    return rows.map((row): Delivery => ({
      id: row.id,
      kind: row.kind,
      channel: row.channel,
      tenantId: row.tenantId,
      userId: row.userId,
      bookingId: row.bookingId,
      waitlistEntryId: row.waitlistEntryId,
      enrolmentId: row.enrolmentId,
      activity:
        row.activityNameGl === null
          ? null
          : { name: { gl: row.activityNameGl, es: row.activityNameEs ?? "" } },
      enrolmentStatus: row.enrolmentStatus,
      noticeReason: row.noticeDetails?.reason ?? null,
      cancelledDates: (row.noticeDetails?.dates ?? []).map((date) =>
        Temporal.Instant.from(date),
      ),
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
      preference: row.preference,
      preferenceVersion: row.preferenceVersion,
      standing: row.standing,
      webhook:
        row.webhookUrl && row.webhookSecretSealed
          ? { url: row.webhookUrl, secretSealed: row.webhookSecretSealed }
          : null,
      facilityId: row.facilityId,
      openingCalendar: row.openingCalendar,
      start: Temporal.Instant.from(row.start),
      end: Temporal.Instant.from(row.end),
      offerExpiresAt: row.offerExpiresAt
        ? Temporal.Instant.from(row.offerExpiresAt)
        : null,
      offerOpen: row.offerOpen,
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
  async pushDevices(tenantId: string, userId: string) {
    const { rows } = await this.db.query<PushDevice>(
      "SELECT id, endpoint, p256dh, auth FROM push_subscriptions WHERE tenant_id=$1 AND user_id=$2 ORDER BY created_at",
      [tenantId, userId],
    );
    return rows;
  }
  async forgetPushDevice(tenantId: string, id: string) {
    await this.db.query(
      "DELETE FROM push_subscriptions WHERE tenant_id=$1 AND id=$2",
      [tenantId, id],
    );
  }
}
