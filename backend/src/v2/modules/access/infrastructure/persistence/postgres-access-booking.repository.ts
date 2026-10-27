// SPDX-License-Identifier: AGPL-3.0-or-later
import { Injectable } from "@nestjs/common";
import { Temporal } from "@js-temporal/polyfill";
import {
  AccessBooking,
  AccessBookingRepository,
} from "../../domain/access-booking.repository";
import { Database } from "../../../../shared/infrastructure/database";
interface Row {
  id: string;
  tenant_id: string;
  user_id: string;
  display_name: string;
  facility_id: string;
  facility_name: string;
  opening_calendar: string;
  starts_at: string;
  ends_at: string;
  status: AccessBooking["status"];
  checked_in_at: string | null;
}
@Injectable()
export class PostgresAccessBookingRepository extends AccessBookingRepository {
  constructor(private readonly db: Database) {
    super();
  }
  async find(tenantId: string, id: string, lock = false) {
    const row = (
      await this.db.query<Row>(
        `SELECT b.id,b.tenant_id,b.user_id,u.display_name,b.facility_id,f.name AS facility_name,f.opening_calendar,b.starts_at,b.ends_at,b.status,b.checked_in_at FROM bookings b JOIN facilities f ON f.tenant_id=b.tenant_id AND f.id=b.facility_id JOIN users u ON u.tenant_id=b.tenant_id AND u.id=b.user_id WHERE b.tenant_id=$1 AND b.id=$2${lock ? " FOR UPDATE OF b" : ""}`,
        [tenantId, id],
      )
    ).rows[0];
    return row
      ? {
          id: row.id,
          tenantId: row.tenant_id,
          userId: row.user_id,
          displayName: row.display_name,
          facilityId: row.facility_id,
          facilityName: row.facility_name,
          openingCalendar: row.opening_calendar,
          start: Temporal.Instant.from(row.starts_at),
          end: Temporal.Instant.from(row.ends_at),
          status: row.status,
          checkedInAt: row.checked_in_at
            ? Temporal.Instant.from(row.checked_in_at)
            : null,
        }
      : null;
  }
  async checkIn(args: {
    tenantId: string;
    id: string;
    at: Temporal.Instant;
    by: string;
  }) {
    await this.db.query(
      "UPDATE bookings SET checked_in_at=$3, checked_in_by=$4 WHERE tenant_id=$1 AND id=$2 AND status='confirmed' AND checked_in_at IS NULL",
      [args.tenantId, args.id, args.at.toString(), args.by],
    );
  }
}
