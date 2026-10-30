// SPDX-License-Identifier: AGPL-3.0-or-later
import { Injectable } from "@nestjs/common";
import { Temporal } from "@js-temporal/polyfill";
import { Database } from "../../../../shared/infrastructure/database";
import { PortabilityRepository } from "../../domain/portability.repository";
import { MunicipalitySnapshot } from "../../domain/municipality-snapshot.read-model";
import { weeklyRule } from "../../../seasons/domain/season-occurrences";
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
json_build_object('id', m.id, 'slug', m.slug, 'name', m.name, 'timezone', m.timezone, 'locale', m.locale, 'advanceDays', m.advance_days, 'cancellationHours', m.cancellation_hours, 'maxActiveBookings', m.max_active_bookings, 'contact', m.contact, 'legalText', m.legal_text, 'legalVersion', m.legal_version, 'retentionMonths', m.retention_months, 'primaryColor', m.primary_color, 'holidaysCalendar', m.holidays_calendar, 'noShowLimit', m.no_show_limit, 'noShowWindowDays', m.no_show_window_days, 'noShowBlockDays', m.no_show_block_days, 'reminderHours', m.reminder_hours, 'mailSenderName', m.mail_sender_name, 'mailReplyTo', m.mail_reply_to, 'enabledCategories', m.enabled_categories, 'storeNif', m.store_nif, 'accessibilityUnit', m.accessibility_unit, 'accessibilityEmail', m.accessibility_email, 'accessibilityPhone', m.accessibility_phone, 'accessibilityReviewedOn', to_char(m.accessibility_reviewed_on, 'YYYY-MM-DD'), 'accessibilityMethod', m.accessibility_method, 'accessibilityExceptionsGl', m.accessibility_exceptions_gl, 'accessibilityExceptionsEs', m.accessibility_exceptions_es, 'dataLicense', m.data_license, 'dir3Code', m.dir3_code, 'analyticsEnabled', m.analytics_enabled, 'accessWebhookUrl', m.access_webhook_url, 'accessWebhookSecretSealed', m.access_webhook_secret_sealed) AS municipality,
coalesce((SELECT json_agg(json_build_object('id', r.id, 'name', r.name, 'sport', r.sport, 'address', r.address, 'description', r.description, 'accessible', r.accessible, 'status', r.status, 'slotMinutes', r.slot_minutes, 'priceCents', r.price_cents, 'openingCalendar', r.opening_calendar, 'rules', r.rules, 'followsMunicipalHolidays', r.follows_municipal_holidays, 'latitude', r.latitude, 'longitude', r.longitude) ORDER BY r.id) FROM facilities r WHERE r.tenant_id=m.id), '[]') AS "facilities",
coalesce((SELECT json_agg(json_build_object('id', r.id, 'facilityId', r.facility_id, 'name', r.name, 'position', r.position, 'parentId', r.parent_id, 'active', r.active, 'createdAt', r.created_at) ORDER BY r.parent_id IS NOT NULL, r.facility_id, r.position, r.id) FROM resources r WHERE r.tenant_id=m.id), '[]') AS "resources",
coalesce((SELECT json_agg(json_build_object('id', r.id, 'displayName', r.display_name, 'role', r.role, 'deletedAt', r.deleted_at, 'email', r.email, 'locale', r.locale, 'assurance', r.assurance, 'nifCiphertext', r.nif_ciphertext, 'nifDigest', r.nif_digest, 'prefersFamilyTariff', r.prefers_family_tariff, 'organizationId', r.organization_id) ORDER BY r.id) FROM users r WHERE r.tenant_id=m.id), '[]') AS "users",
coalesce((SELECT json_agg(json_build_object('id', r.id, 'userId', r.user_id, 'facilityId', r.facility_id, 'resourceId', r.resource_id, 'start', r.starts_at, 'end', r.ends_at, 'status', r.status, 'createdAt', r.created_at, 'cancelledAt', r.cancelled_at, 'cancellationHours', r.cancellation_hours, 'cancelledBy', r.cancelled_by, 'cancellationReason', r.cancellation_reason, 'sequence', r.sequence, 'tariffCategory', r.tariff_category, 'priceCents', r.price_cents) ORDER BY r.id, r.user_id) FROM bookings r WHERE r.tenant_id=m.id), '[]') AS "bookings",
coalesce((SELECT json_agg(json_build_object('id', r.id, 'userId', r.user_id, 'issuer', r.issuer, 'subject', r.subject, 'createdAt', r.created_at) ORDER BY r.id) FROM identities r WHERE r.tenant_id=m.id), '[]') AS "identities",
coalesce((SELECT json_agg(json_build_object('id', r.id, 'userId', r.user_id, 'bookingId', r.booking_id, 'kind', r.kind, 'createdAt', r.created_at, 'details', r.details, 'dedupeKey', r.dedupe_key) ORDER BY r.id, r.user_id, r.kind) FROM notifications r WHERE r.tenant_id=m.id), '[]') AS "notifications",
coalesce((SELECT json_agg(json_build_object('id', r.id, 'actorId', r.actor_id, 'action', r.action, 'resourceId', r.resource_id, 'occurredAt', r.occurred_at, 'actorRole', r.actor_role, 'details', r.details) ORDER BY r.id) FROM audit_events r WHERE r.tenant_id=m.id), '[]') AS "auditEvents",
coalesce((SELECT json_agg(json_build_object('id', r.id, 'userId', r.user_id, 'legalVersion', r.legal_version, 'acceptedAt', r.accepted_at) ORDER BY r.id, r.user_id) FROM consents r WHERE r.tenant_id=m.id), '[]') AS "consents",
coalesce((SELECT json_agg(json_build_object('version', r.version, 'textGl', r.text_gl, 'textEs', r.text_es, 'publishedAt', r.published_at) ORDER BY r.version) FROM legal_texts r WHERE r.tenant_id=m.id), '[]') AS "legalTexts",
coalesce((SELECT json_agg(json_build_object('contentType', r.content_type, 'data', encode(r.data, 'base64'), 'sha256', r.sha256, 'updatedAt', r.updated_at) ORDER BY r.tenant_id) FROM municipality_logos r WHERE r.tenant_id=m.id), '[]') AS "logos",
coalesce((SELECT json_agg(json_build_object('id', r.id, 'userId', r.user_id, 'bookingId', r.booking_id, 'start', r.starts_at, 'end', r.ends_at, 'liftedAt', r.lifted_at) ORDER BY r.id, r.user_id) FROM booking_blocks r WHERE r.tenant_id=m.id), '[]') AS "bookingBlocks",
coalesce((SELECT json_agg(json_build_object('userId', r.user_id, 'kind', r.kind, 'channel', r.channel, 'enabled', r.enabled, 'updatedAt', r.updated_at) ORDER BY r.user_id, r.kind, r.channel) FROM notification_preferences r WHERE r.tenant_id=m.id), '[]') AS "notificationPreferences",
coalesce((SELECT json_agg(json_build_object('id', r.id, 'userId', r.user_id, 'bookingId', r.booking_id, 'kind', r.kind, 'channel', r.channel, 'dedupeKey', r.dedupe_key, 'createdAt', r.created_at, 'availableAt', r.available_at, 'attempts', r.attempts, 'lockedUntil', r.locked_until, 'sentAt', r.sent_at, 'lastError', r.last_error) ORDER BY r.id, r.user_id, r.kind, r.channel) FROM outbox r WHERE r.tenant_id=m.id), '[]') AS "messages"
,coalesce((SELECT json_agg(json_build_object('facilityId', r.facility_id, 'category', r.category, 'priceCents', r.price_cents) ORDER BY r.facility_id, r.category) FROM facility_prices r WHERE r.tenant_id=m.id), '[]') AS "facilityPrices"
,coalesce((SELECT json_agg(json_build_object('userId', r.user_id, 'category', r.category, 'status', r.status, 'requestedAt', r.requested_at, 'decidedAt', r.decided_at) ORDER BY r.user_id, r.category) FROM user_categories r WHERE r.tenant_id=m.id), '[]') AS "userCategories"
,coalesce((SELECT json_agg(json_build_object('facilityId', r.facility_id, 'status', r.status, 'start', r.starts_at, 'end', r.ends_at) ORDER BY r.facility_id, r.starts_at) FROM facility_status_periods r WHERE r.tenant_id=m.id), '[]') AS "facilityStatusPeriods"
,coalesce((SELECT json_agg(json_build_object('kid', r.kid, 'publicJwk', r.public_jwk, 'privateKeySealed', r.private_key_sealed, 'createdAt', r.created_at, 'retiredAt', r.retired_at) ORDER BY r.kid) FROM access_keys r WHERE r.tenant_id=m.id), '[]') AS "accessKeys"
,coalesce((SELECT json_agg(json_build_object('id', r.id, 'bookingId', r.booking_id, 'sequence', r.booking_sequence, 'actorId', r.actor_id, 'method', r.method, 'checkedInAt', r.checked_in_at, 'recordedAt', r.recorded_at) ORDER BY r.id) FROM check_ins r WHERE r.tenant_id=m.id), '[]') AS "checkIns"
,coalesce((SELECT json_agg(json_build_object('id', r.id, 'name', r.name, 'taxId', r.tax_id, 'sport', r.sport, 'contactEmail', r.contact_email, 'createdAt', r.created_at, 'archivedAt', r.archived_at) ORDER BY r.id) FROM organizations r WHERE r.tenant_id=m.id), '[]') AS "organizations"
,coalesce((SELECT json_agg(json_build_object('id', r.id, 'name', r.name, 'startsOn', to_char(r.starts_on, 'YYYY-MM-DD'), 'endsOn', to_char(r.ends_on, 'YYYY-MM-DD'), 'criteriaGl', r.criteria_gl, 'criteriaEs', r.criteria_es, 'facilityIds', ARRAY(SELECT f.facility_id FROM season_campaign_facilities f WHERE f.tenant_id=r.tenant_id AND f.campaign_id=r.id ORDER BY f.facility_id), 'createdAt', r.created_at) ORDER BY r.id) FROM season_campaigns r WHERE r.tenant_id=m.id), '[]') AS "seasonCampaigns"
,coalesce((SELECT json_agg(json_build_object('id', r.id, 'campaignId', r.campaign_id, 'organizationId', r.organization_id, 'facilityId', r.facility_id, 'resourceId', r.resource_id, 'weekdays', r.weekdays, 'startsLocal', to_char(r.starts_local, 'HH24:MI'), 'endsLocal', to_char(r.ends_local, 'HH24:MI'), 'reason', r.reason, 'createdBy', r.created_by, 'createdAt', r.created_at, 'cancelledAt', r.cancelled_at, 'cancellationReason', r.cancellation_reason, 'endsOn', (SELECT to_char(c.ends_on, 'YYYY-MM-DD') FROM season_campaigns c WHERE c.tenant_id=r.tenant_id AND c.id=r.campaign_id)) ORDER BY r.id) FROM season_allocations r WHERE r.tenant_id=m.id), '[]') AS "seasonAllocations"
,coalesce((SELECT json_agg(json_build_object('id', r.id, 'allocationId', r.allocation_id, 'start', r.starts_at, 'end', r.ends_at, 'status', r.status, 'conflictBookingId', r.conflict_booking_id, 'cancellationReason', r.cancellation_reason) ORDER BY r.id) FROM season_occurrences r WHERE r.tenant_id=m.id), '[]') AS "seasonOccurrences"
,coalesce((SELECT json_agg(json_build_object('code', r.code, 'nameGl', r.name_gl, 'nameEs', r.name_es, 'cnidClass', r.cnid_class, 'cnidType', r.cnid_type, 'schemaType', r.schema_type, 'art', r.art, 'hidden', r.hidden, 'position', r.position) ORDER BY r.position, r.code) FROM sports r WHERE r.tenant_id=m.id), '[]') AS "sports"
,coalesce((SELECT json_agg(json_build_object('id', r.id, 'facilityId', r.facility_id, 'contentType', r.content_type, 'data', encode(r.data, 'base64'), 'sha256', r.sha256, 'altGl', r.alt_gl, 'altEs', r.alt_es, 'position', r.position, 'createdAt', r.created_at) ORDER BY r.facility_id, r.position, r.id) FROM facility_photos r WHERE r.tenant_id=m.id), '[]') AS "facilityPhotos"
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
      accessKeys: row.accessKeys.map((value) => ({
        ...value,
        createdAt: Temporal.Instant.from(value.createdAt),
        retiredAt:
          value.retiredAt === null
            ? null
            : Temporal.Instant.from(value.retiredAt),
      })),
      checkIns: row.checkIns.map((value) => ({
        ...value,
        checkedInAt: Temporal.Instant.from(value.checkedInAt),
        recordedAt: Temporal.Instant.from(value.recordedAt),
      })),

      facilities: row.facilities,
      facilityStatusPeriods: row.facilityStatusPeriods.map((value) => ({
        ...value,
        start: Temporal.Instant.from(value.start),
        end: value.end === null ? null : Temporal.Instant.from(value.end),
      })),
      facilityPrices: row.facilityPrices,
      userCategories: row.userCategories.map((value) => ({
        ...value,
        requestedAt:
          value.requestedAt === null
            ? null
            : Temporal.Instant.from(value.requestedAt),
        decidedAt:
          value.decidedAt === null
            ? null
            : Temporal.Instant.from(value.decidedAt),
      })),
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
      identities: row.identities.map((value) => ({
        ...value,
        createdAt: Temporal.Instant.from(value.createdAt),
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
      organizations: row.organizations,
      seasonCampaigns: row.seasonCampaigns,
      // The rule is derived for readers of the package; endsOn only feeds it.
      seasonAllocations: (
        row.seasonAllocations as (Row["seasonAllocations"][number] & {
          endsOn: string;
        })[]
      ).map(({ endsOn, ...value }) => ({
        ...value,
        rrule: weeklyRule(value.weekdays, endsOn),
      })),
      seasonOccurrences: row.seasonOccurrences,
      sports: row.sports,
      facilityPhotos: row.facilityPhotos,
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
