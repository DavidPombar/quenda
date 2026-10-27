// SPDX-License-Identifier: AGPL-3.0-or-later
import { Injectable } from "@nestjs/common";
import { Temporal } from "@js-temporal/polyfill";
import { Database } from "../../../../shared/infrastructure/database";
import {
  BookingSpan,
  InsightsFacility,
  InsightsRepository,
} from "../../domain/insights.repository";
@Injectable()
export class PostgresInsightsRepository extends InsightsRepository {
  constructor(private readonly db: Database) {
    super();
  }
  async facilities(tenantId: string) {
    return (
      await this.db.query<InsightsFacility>(
        'SELECT id, name, sport, status, opening_calendar AS "openingCalendar", follows_municipal_holidays AS "followsMunicipalHolidays" FROM facilities WHERE tenant_id=$1 ORDER BY name',
        [tenantId],
      )
    ).rows;
  }
  async statusPeriods(
    tenantId: string,
    start: Temporal.Instant,
    end: Temporal.Instant,
  ) {
    const { rows } = await this.db.query<{
      facilityId: string;
      status: string;
      start: string;
      end: string | null;
    }>(
      'SELECT facility_id AS "facilityId", status, starts_at AS start, ends_at AS end FROM facility_status_periods WHERE tenant_id=$1 AND starts_at<$3 AND (ends_at IS NULL OR ends_at>$2)',
      [tenantId, start.toString(), end.toString()],
    );
    return rows.map((row) => ({
      facilityId: row.facilityId,
      status: row.status,
      start: Temporal.Instant.from(row.start),
      end: row.end === null ? null : Temporal.Instant.from(row.end),
    }));
  }
  async bookings(
    tenantId: string,
    start: Temporal.Instant,
    end: Temporal.Instant,
  ) {
    const { rows } = await this.db.query<{
      facilityId: string;
      start: string;
      end: string;
      status: BookingSpan["status"];
    }>(
      'SELECT facility_id AS "facilityId", starts_at AS start, ends_at AS end, status FROM bookings WHERE tenant_id=$1 AND starts_at<$3 AND ends_at>$2',
      [tenantId, start.toString(), end.toString()],
    );
    return rows.map((row) => ({
      facilityId: row.facilityId,
      start: Temporal.Instant.from(row.start),
      end: Temporal.Instant.from(row.end),
      status: row.status,
    }));
  }
}
