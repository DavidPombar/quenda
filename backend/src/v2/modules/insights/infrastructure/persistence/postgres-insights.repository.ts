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
        `SELECT id, name, sport, status, opening_calendar AS "openingCalendar", follows_municipal_holidays AS "followsMunicipalHolidays", ARRAY(SELECT r.id FROM resources r WHERE r.tenant_id=f.tenant_id AND r.facility_id=f.id AND r.active AND NOT EXISTS (SELECT 1 FROM resources part WHERE part.tenant_id=r.tenant_id AND part.parent_id=r.id) ORDER BY r.id) AS "unitIds", coalesce((SELECT json_agg(json_build_object('id', r.id, 'name', r.name, 'parentId', r.parent_id, 'unitIds', ARRAY(SELECT u.id FROM resources u WHERE u.tenant_id=r.tenant_id AND u.active AND (u.id=r.id OR u.parent_id=r.id) AND NOT EXISTS (SELECT 1 FROM resources part WHERE part.tenant_id=u.tenant_id AND part.parent_id=u.id) ORDER BY u.id)) ORDER BY r.position, r.name) FROM resources r WHERE r.tenant_id=f.tenant_id AND r.facility_id=f.id AND r.active), '[]') AS resources, EXISTS(SELECT 1 FROM facility_status_periods h WHERE h.tenant_id=f.tenant_id AND h.facility_id=f.id) AS "hasStatusHistory" FROM facilities f WHERE tenant_id=$1 ORDER BY name`,
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
      resourceId: string;
      start: string;
      end: string;
      status: BookingSpan["status"];
      unitIds: string[];
    }>(
      'SELECT b.facility_id AS "facilityId", b.resource_id AS "resourceId", b.starts_at AS start, b.ends_at AS end, b.status, ARRAY(SELECT coalesce(part.id,r.id) FROM resources r LEFT JOIN resources part ON part.tenant_id=r.tenant_id AND part.parent_id=r.id WHERE r.tenant_id=b.tenant_id AND r.id=b.resource_id ORDER BY coalesce(part.id,r.id)) AS "unitIds" FROM bookings b WHERE b.tenant_id=$1 AND b.starts_at<$3 AND b.ends_at>$2 UNION ALL SELECT a.facility_id, a.resource_id, s.starts_at, s.ends_at, \'season\', ARRAY(SELECT coalesce(part.id,r.id) FROM resources r LEFT JOIN resources part ON part.tenant_id=r.tenant_id AND part.parent_id=r.id WHERE r.tenant_id=a.tenant_id AND r.id=a.resource_id ORDER BY coalesce(part.id,r.id)) FROM season_occurrences s JOIN season_allocations a ON a.tenant_id=s.tenant_id AND a.id=s.allocation_id WHERE s.tenant_id=$1 AND s.status=\'active\' AND s.starts_at<$3 AND s.ends_at>$2',
      [tenantId, start.toString(), end.toString()],
    );
    return rows.map((row) => ({
      facilityId: row.facilityId,
      resourceId: row.resourceId,
      start: Temporal.Instant.from(row.start),
      end: Temporal.Instant.from(row.end),
      status: row.status,
      unitIds: row.unitIds,
    }));
  }
}
