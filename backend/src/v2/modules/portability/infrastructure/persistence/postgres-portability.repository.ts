// SPDX-License-Identifier: AGPL-3.0-or-later
import { Injectable } from "@nestjs/common";
import { Temporal } from "@js-temporal/polyfill";
import { Database } from "../../../../shared/infrastructure/database";
import { PortabilityRepository } from "../../domain/portability.repository";
import { MunicipalitySnapshot } from "../../domain/municipality-snapshot.read-model";
type Raw<T> = {
  [K in keyof T]: T[K] extends Temporal.Instant
    ? string
    : T[K] extends Temporal.Instant | null
      ? string | null
      : T[K];
};
type Row = {
  [
    K in keyof MunicipalitySnapshot
  ]: MunicipalitySnapshot[K] extends (infer Item)[]
    ? Raw<Item>[]
    : Raw<MunicipalitySnapshot[K]>;
};
// One SQL statement gives every collection the same MVCC snapshot.
const sql = `SELECT
json_build_object('id', m.id, 'slug', m.slug, 'name', m.name, 'timezone', m.timezone, 'locale', m.locale, 'advanceDays', m.advance_days, 'cancellationHours', m.cancellation_hours, 'maxActiveBookings', m.max_active_bookings, 'contact', m.contact, 'legalText', m.legal_text, 'legalVersion', m.legal_version, 'retentionMonths', m.retention_months, 'primaryColor', m.primary_color, 'holidaysCalendar', m.holidays_calendar, 'noShowLimit', m.no_show_limit, 'noShowWindowDays', m.no_show_window_days, 'noShowBlockDays', m.no_show_block_days, 'reminderHours', m.reminder_hours, 'mailSenderName', m.mail_sender_name, 'mailReplyTo', m.mail_reply_to) AS municipality,
coalesce((SELECT json_agg(json_build_object('id', r.id, 'name', r.name, 'sport', r.sport, 'address', r.address, 'description', r.description, 'accessible', r.accessible, 'status', r.status, 'slotMinutes', r.slot_minutes, 'priceCents', r.price_cents, 'openingCalendar', r.opening_calendar, 'rules', r.rules, 'followsMunicipalHolidays', r.follows_municipal_holidays) ORDER BY r.id) FROM facilities r WHERE r.tenant_id=m.id), '[]') AS "facilities",
coalesce((SELECT json_agg(json_build_object('id', r.id, 'facilityId', r.facility_id, 'name', r.name, 'position', r.position, 'parentId', r.parent_id, 'active', r.active, 'createdAt', r.created_at) ORDER BY r.parent_id IS NOT NULL, r.facility_id, r.position, r.id) FROM resources r WHERE r.tenant_id=m.id), '[]') AS "resources",
coalesce((SELECT json_agg(json_build_object('id', r.id, 'displayName', r.display_name, 'role', r.role, 'deletedAt', r.deleted_at, 'email', r.email, 'locale', r.locale) ORDER BY r.id) FROM users r WHERE r.tenant_id=m.id), '[]') AS "users",
coalesce((SELECT json_agg(json_build_object('id', r.id, 'userId', r.user_id, 'facilityId', r.facility_id, 'resourceId', r.resource_id, 'start', r.starts_at, 'end', r.ends_at, 'status', r.status, 'createdAt', r.created_at, 'cancelledAt', r.cancelled_at, 'cancellationHours', r.cancellation_hours, 'cancelledBy', r.cancelled_by, 'cancellationReason', r.cancellation_reason, 'sequence', r.sequence) ORDER BY r.id, r.user_id) FROM bookings r WHERE r.tenant_id=m.id), '[]') AS "bookings",
coalesce((SELECT json_agg(json_build_object('id', r.id, 'userId', r.user_id, 'bookingId', r.booking_id, 'kind', r.kind, 'createdAt', r.created_at, 'details', r.details) ORDER BY r.id, r.user_id, r.kind) FROM notifications r WHERE r.tenant_id=m.id), '[]') AS "notifications",
coalesce((SELECT json_agg(json_build_object('id', r.id, 'actorId', r.actor_id, 'action', r.action, 'resourceId', r.resource_id, 'occurredAt', r.occurred_at, 'actorRole', r.actor_role, 'details', r.details) ORDER BY r.id) FROM audit_events r WHERE r.tenant_id=m.id), '[]') AS "auditEvents",
coalesce((SELECT json_agg(json_build_object('id', r.id, 'userId', r.user_id, 'legalVersion', r.legal_version, 'acceptedAt', r.accepted_at) ORDER BY r.id, r.user_id) FROM consents r WHERE r.tenant_id=m.id), '[]') AS "consents",
coalesce((SELECT json_agg(json_build_object('version', r.version, 'textGl', r.text_gl, 'textEs', r.text_es, 'publishedAt', r.published_at) ORDER BY r.version) FROM legal_texts r WHERE r.tenant_id=m.id), '[]') AS "legalTexts",
coalesce((SELECT json_agg(json_build_object('contentType', r.content_type, 'data', encode(r.data, 'base64'), 'sha256', r.sha256, 'updatedAt', r.updated_at) ORDER BY r.tenant_id) FROM municipality_logos r WHERE r.tenant_id=m.id), '[]') AS "logos",
coalesce((SELECT json_agg(json_build_object('id', r.id, 'userId', r.user_id, 'bookingId', r.booking_id, 'start', r.starts_at, 'end', r.ends_at, 'liftedAt', r.lifted_at) ORDER BY r.id, r.user_id) FROM booking_blocks r WHERE r.tenant_id=m.id), '[]') AS "bookingBlocks",
coalesce((SELECT json_agg(json_build_object('userId', r.user_id, 'kind', r.kind, 'channel', r.channel, 'enabled', r.enabled, 'updatedAt', r.updated_at) ORDER BY r.user_id, r.kind, r.channel) FROM notification_preferences r WHERE r.tenant_id=m.id), '[]') AS "notificationPreferences",
coalesce((SELECT json_agg(json_build_object('id', r.id, 'userId', r.user_id, 'bookingId', r.booking_id, 'kind', r.kind, 'channel', r.channel, 'dedupeKey', r.dedupe_key, 'createdAt', r.created_at, 'availableAt', r.available_at, 'attempts', r.attempts, 'lockedUntil', r.locked_until, 'sentAt', r.sent_at, 'lastError', r.last_error) ORDER BY r.id, r.user_id, r.kind, r.channel) FROM outbox r WHERE r.tenant_id=m.id), '[]') AS "messages"
FROM municipalities m WHERE m.id=$1`;
@Injectable()
export class PostgresPortabilityRepository extends PortabilityRepository {
  constructor(private readonly db: Database) {
    super();
  }
  async snapshot(tenantId: string): Promise<MunicipalitySnapshot | null> {
    const row = (await this.db.query<Row>(sql, [tenantId])).rows[0];
    if (!row) return null;
    return {
      municipality: row.municipality,
      facilities: row.facilities,
      resources: row.resources.map((value) => ({
        ...value,
        createdAt: Temporal.Instant.from(value.createdAt),
      })),
      users: row.users.map((value) => ({
        ...value,
        deletedAt:
          value.deletedAt === null
            ? null
            : Temporal.Instant.from(value.deletedAt),
      })),
      bookings: row.bookings.map((value) => ({
        ...value,
        start: Temporal.Instant.from(value.start),
        end: Temporal.Instant.from(value.end),
        createdAt: Temporal.Instant.from(value.createdAt),
        cancelledAt:
          value.cancelledAt === null
            ? null
            : Temporal.Instant.from(value.cancelledAt),
      })),
      notifications: row.notifications.map((value) => ({
        ...value,
        createdAt: Temporal.Instant.from(value.createdAt),
      })),
      auditEvents: row.auditEvents.map((value) => ({
        ...value,
        occurredAt: Temporal.Instant.from(value.occurredAt),
      })),
      consents: row.consents.map((value) => ({
        ...value,
        acceptedAt: Temporal.Instant.from(value.acceptedAt),
      })),
      legalTexts: row.legalTexts.map((value) => ({
        ...value,
        publishedAt: Temporal.Instant.from(value.publishedAt),
      })),
      logos: row.logos.map((value) => ({
        ...value,
        updatedAt: Temporal.Instant.from(value.updatedAt),
      })),
      bookingBlocks: row.bookingBlocks.map((value) => ({
        ...value,
        start: Temporal.Instant.from(value.start),
        end: Temporal.Instant.from(value.end),
        liftedAt:
          value.liftedAt === null
            ? null
            : Temporal.Instant.from(value.liftedAt),
      })),
      notificationPreferences: row.notificationPreferences.map((value) => ({
        ...value,
        updatedAt: Temporal.Instant.from(value.updatedAt),
      })),
      messages: row.messages.map((value) => ({
        ...value,
        createdAt: Temporal.Instant.from(value.createdAt),
        availableAt: Temporal.Instant.from(value.availableAt),
        lockedUntil:
          value.lockedUntil === null
            ? null
            : Temporal.Instant.from(value.lockedUntil),
        sentAt:
          value.sentAt === null ? null : Temporal.Instant.from(value.sentAt),
      })),
    };
  }
}
