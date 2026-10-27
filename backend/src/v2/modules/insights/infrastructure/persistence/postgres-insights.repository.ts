// SPDX-License-Identifier: AGPL-3.0-or-later
import { Injectable } from "@nestjs/common";
import { Database } from "../../../../shared/infrastructure/database";
import {
  InsightsRepository,
  FacilityUsage,
} from "../../domain/insights.repository";
@Injectable()
export class PostgresInsightsRepository extends InsightsRepository {
  constructor(private readonly db: Database) {
    super();
  }
  async usage(tenantId: string, from: string, to: string) {
    return (
      await this.db.query<FacilityUsage>(
        `SELECT f.id,f.name,f.opening_calendar AS "openingCalendar",f.status,
      count(b.id) FILTER(WHERE b.status='confirmed')::int AS bookings,
      count(b.id) FILTER(WHERE b.status='cancelled')::int AS cancelled,
      count(b.id) FILTER(WHERE b.status='no_show')::int AS "noShows",
      coalesce(sum(extract(epoch FROM (least(b.ends_at,$3::timestamptz)-greatest(b.starts_at,$2::timestamptz)))/60) FILTER(WHERE b.status='confirmed'),0)::float AS minutes
      FROM facilities f LEFT JOIN bookings b ON f.id=b.facility_id AND f.tenant_id=b.tenant_id AND b.starts_at<$3 AND b.ends_at>$2
      WHERE f.tenant_id=$1 GROUP BY f.id ORDER BY f.name`,
        [tenantId, from, to],
      )
    ).rows;
  }
}
