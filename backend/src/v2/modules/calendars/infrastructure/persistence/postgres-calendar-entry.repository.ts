// SPDX-License-Identifier: AGPL-3.0-or-later
import { Injectable } from "@nestjs/common";
import { Temporal } from "@js-temporal/polyfill";
import { CalendarEntryRepository } from "../../domain/calendar-entry.repository";
import { CalendarEntry } from "../../domain/calendar-entry.read-model";
import { Database } from "../../../../shared/infrastructure/database";
interface Row {
  uid: string;
  activity_name: string | null;
  starts_at: string;
  ends_at: string;
  status: "confirmed" | "cancelled" | "no_show" | "active";
  sequence: number;
  created_at: string;
  facility_name: string;
  resource_name: string;
  facility_address: string;
  municipality_name: string;
}
const SELECT =
  "SELECT b.id || '@quenda' AS uid,NULL::text AS activity_name,b.starts_at,b.ends_at,b.status,b.sequence,b.created_at,f.name AS facility_name,r.name AS resource_name,f.address AS facility_address,m.name AS municipality_name FROM bookings b JOIN facilities f ON f.tenant_id=b.tenant_id AND f.id=b.facility_id JOIN resources r ON r.tenant_id=b.tenant_id AND r.id=b.resource_id JOIN municipalities m ON m.id=b.tenant_id";
/** Sessions of the activities the person holds a place in (#97); `$1` tenant, `$2` user, `$3` since. */
const SESSIONS = `SELECT x.id || '-' || e.id || '@quenda' AS uid, a.name_gl AS activity_name, x.starts_at, x.ends_at,
  x.status, x.sequence, e.created_at, f.name AS facility_name, r.name AS resource_name,
  f.address AS facility_address, m.name AS municipality_name
  FROM activity_enrolments e
  JOIN activities a ON a.tenant_id=e.tenant_id AND a.id=e.activity_id
  JOIN activity_sessions x ON x.tenant_id=a.tenant_id AND x.activity_id=a.id
  JOIN facilities f ON f.tenant_id=a.tenant_id AND f.id=a.facility_id
  JOIN resources r ON r.tenant_id=a.tenant_id AND r.id=a.resource_id
  JOIN municipalities m ON m.id=a.tenant_id
  WHERE e.tenant_id=$1 AND e.user_id=$2 AND e.status='enrolled' AND x.ends_at>$3`;
function toEntry(row: Row): CalendarEntry {
  return {
    uid: row.uid,
    activityName: row.activity_name,
    start: Temporal.Instant.from(row.starts_at),
    end: Temporal.Instant.from(row.ends_at),
    status:
      row.status === "no_show" || row.status === "cancelled"
        ? "cancelled"
        : "confirmed",
    sequence: row.sequence,
    createdAt: Temporal.Instant.from(row.created_at),
    facilityName: row.facility_name,
    resourceName: row.resource_name,
    facilityAddress: row.facility_address,
    municipalityName: row.municipality_name,
  };
}
@Injectable()
export class PostgresCalendarEntryRepository extends CalendarEntryRepository {
  constructor(private readonly db: Database) {
    super();
  }
  async find(tenantId: string, userId: string, bookingId: string) {
    const { rows } = await this.db.query<Row>(
      `${SELECT} WHERE b.tenant_id=$1 AND b.user_id=$2 AND b.id=$3`,
      [tenantId, userId, bookingId],
    );
    return rows[0] ? toEntry(rows[0]) : null;
  }
  async listEndingAfter(
    tenantId: string,
    userId: string,
    since: Temporal.Instant,
  ) {
    const { rows } = await this.db.query<Row>(
      `(${SELECT} WHERE b.tenant_id=$1 AND b.user_id=$2 AND b.ends_at>$3)
      UNION ALL (${SESSIONS}) ORDER BY starts_at LIMIT 500`,
      [tenantId, userId, since.toString()],
    );
    return rows.map(toEntry);
  }
}
