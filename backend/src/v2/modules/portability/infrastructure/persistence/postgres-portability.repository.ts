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
interface Row {
  municipality: MunicipalitySnapshot["municipality"];
  facilities: MunicipalitySnapshot["facilities"];
  users: MunicipalitySnapshot["users"];
  bookings: Raw<MunicipalitySnapshot["bookings"][number]>[];
  notifications: Raw<MunicipalitySnapshot["notifications"][number]>[];
  auditEvents: Raw<MunicipalitySnapshot["auditEvents"][number]>[];
}
const instant = (value: string) => Temporal.Instant.from(value);
// One statement, so every collection comes from the same MVCC snapshot.
const sql = `
SELECT
  json_build_object('id', m.id, 'slug', m.slug, 'name', m.name, 'timezone', m.timezone,
    'locale', m.locale, 'advanceDays', m.advance_days, 'cancellationHours', m.cancellation_hours,
    'maxActiveBookings', m.max_active_bookings, 'contact', m.contact, 'legalText', m.legal_text
  ) AS municipality,
  coalesce((SELECT json_agg(json_build_object('id', f.id, 'name', f.name, 'sport', f.sport,
    'address', f.address, 'description', f.description, 'accessible', f.accessible,
    'status', f.status, 'slotMinutes', f.slot_minutes, 'priceCents', f.price_cents,
    'openingCalendar', f.opening_calendar, 'rules', f.rules) ORDER BY f.id)
    FROM facilities f WHERE f.tenant_id = m.id), '[]') AS facilities,
  coalesce((SELECT json_agg(json_build_object('id', u.id, 'displayName', u.display_name,
    'role', u.role) ORDER BY u.id)
    FROM users u WHERE u.tenant_id = m.id), '[]') AS users,
  coalesce((SELECT json_agg(json_build_object('id', b.id, 'userId', b.user_id,
    'facilityId', b.facility_id, 'start', b.starts_at, 'end', b.ends_at, 'status', b.status,
    'createdAt', b.created_at, 'cancelledAt', b.cancelled_at) ORDER BY b.starts_at, b.id)
    FROM bookings b WHERE b.tenant_id = m.id), '[]') AS bookings,
  coalesce((SELECT json_agg(json_build_object('id', n.id, 'userId', n.user_id,
    'bookingId', n.booking_id, 'kind', n.kind, 'createdAt', n.created_at)
    ORDER BY n.created_at, n.id)
    FROM notifications n WHERE n.tenant_id = m.id), '[]') AS notifications,
  coalesce((SELECT json_agg(json_build_object('id', a.id, 'actorId', a.actor_id,
    'action', a.action, 'resourceId', a.resource_id, 'occurredAt', a.occurred_at)
    ORDER BY a.occurred_at, a.id)
    FROM audit_events a WHERE a.tenant_id = m.id), '[]') AS "auditEvents"
FROM municipalities m WHERE m.id = $1`;
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
      users: row.users,
      bookings: row.bookings.map((booking) => ({
        ...booking,
        start: instant(booking.start),
        end: instant(booking.end),
        createdAt: instant(booking.createdAt),
        cancelledAt: booking.cancelledAt ? instant(booking.cancelledAt) : null,
      })),
      notifications: row.notifications.map((notification) => ({
        ...notification,
        createdAt: instant(notification.createdAt),
      })),
      auditEvents: row.auditEvents.map((event) => ({
        ...event,
        occurredAt: instant(event.occurredAt),
      })),
    };
  }
}
