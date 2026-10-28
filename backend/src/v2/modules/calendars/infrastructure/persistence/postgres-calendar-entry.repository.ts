// SPDX-License-Identifier: AGPL-3.0-or-later
import { Injectable } from "@nestjs/common";
import { Temporal } from "@js-temporal/polyfill";
import { CalendarEntryRepository } from "../../domain/calendar-entry.repository";
import { CalendarEntry } from "../../domain/calendar-entry.read-model";
import { Database } from "../../../../shared/infrastructure/database";
interface Row {
  id: string;
  starts_at: string;
  ends_at: string;
  status: "confirmed" | "cancelled" | "no_show";
  sequence: number;
  created_at: string;
  facility_name: string;
  facility_address: string;
  municipality_name: string;
}
const SELECT =
  "SELECT b.id,b.starts_at,b.ends_at,b.status,b.sequence,b.created_at,f.name AS facility_name,f.address AS facility_address,m.name AS municipality_name FROM bookings b JOIN facilities f ON f.tenant_id=b.tenant_id AND f.id=b.facility_id JOIN municipalities m ON m.id=b.tenant_id";
function toEntry(row: Row): CalendarEntry {
  return {
    bookingId: row.id,
    start: Temporal.Instant.from(row.starts_at),
    end: Temporal.Instant.from(row.ends_at),
    status: row.status === "no_show" ? "cancelled" : row.status,
    sequence: row.sequence,
    createdAt: Temporal.Instant.from(row.created_at),
    facilityName: row.facility_name,
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
      `${SELECT} WHERE b.tenant_id=$1 AND b.user_id=$2 AND b.ends_at>$3 ORDER BY b.starts_at LIMIT 500`,
      [tenantId, userId, since.toString()],
    );
    return rows.map(toEntry);
  }
}
