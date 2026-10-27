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
      (SELECT coalesce(sum(extract(epoch FROM (least(u.ends_at,$3::timestamptz)-greatest(u.starts_at,$2::timestamptz)))/60),0)::float
        FROM booking_units u JOIN resources r ON r.tenant_id=u.tenant_id AND r.id=u.unit_id
        WHERE r.tenant_id=f.tenant_id AND r.facility_id=f.id AND u.starts_at<$3 AND u.ends_at>$2) AS minutes,
      (SELECT count(*)::int FROM resources r
        WHERE r.tenant_id=f.tenant_id AND r.facility_id=f.id AND r.active
          AND NOT EXISTS (SELECT 1 FROM resources part WHERE part.tenant_id=r.tenant_id AND part.parent_id=r.id)) AS units
      FROM facilities f LEFT JOIN bookings b ON f.id=b.facility_id AND f.tenant_id=b.tenant_id AND b.starts_at<$3 AND b.ends_at>$2
      WHERE f.tenant_id=$1 GROUP BY f.id ORDER BY f.name`,
        [tenantId, from, to],
      )
    ).rows;
  }
}
