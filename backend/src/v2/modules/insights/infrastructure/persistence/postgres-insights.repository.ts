// SPDX-License-Identifier: AGPL-3.0-or-later
import { Injectable } from "@nestjs/common";
import { Temporal } from "@js-temporal/polyfill";
import { Database } from "../../../../shared/infrastructure/database";
import {
  ActivityFigures,
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
        `SELECT id, name, sport, status, opening_calendar AS "openingCalendar", follows_municipal_holidays AS "followsMunicipalHolidays", ARRAY(SELECT r.id FROM resources r WHERE r.tenant_id=f.tenant_id AND r.facility_id=f.id AND r.active AND NOT EXISTS (SELECT 1 FROM resources part WHERE part.tenant_id=r.tenant_id AND part.parent_id=r.id) ORDER BY r.id) AS "unitIds", coalesce((SELECT json_object_agg(r.id, r.capacity) FROM resources r WHERE r.tenant_id=f.tenant_id AND r.facility_id=f.id AND r.active AND r.capacity IS NOT NULL), '{}') AS capacities, coalesce((SELECT json_agg(json_build_object('id', r.id, 'name', r.name, 'parentId', r.parent_id, 'unitIds', ARRAY(SELECT u.id FROM resources u WHERE u.tenant_id=r.tenant_id AND u.active AND (u.id=r.id OR u.parent_id=r.id) AND NOT EXISTS (SELECT 1 FROM resources part WHERE part.tenant_id=u.tenant_id AND part.parent_id=u.id) ORDER BY u.id)) ORDER BY r.position, r.name) FROM resources r WHERE r.tenant_id=f.tenant_id AND r.facility_id=f.id AND r.active), '[]') AS resources, EXISTS(SELECT 1 FROM facility_status_periods h WHERE h.tenant_id=f.tenant_id AND h.facility_id=f.id) AS "hasStatusHistory" FROM facilities f WHERE tenant_id=$1 ORDER BY name`,
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
  async waitlistOutcomes(
    tenantId: string,
    from: Temporal.PlainDate,
    to: Temporal.PlainDate,
  ) {
    const { rows } = await this.db.query<{
      accepted: number;
      expired: number;
    }>(
      "SELECT COALESCE(sum(accepted),0)::int AS accepted, COALESCE(sum(expired),0)::int AS expired FROM waitlist_outcomes WHERE tenant_id=$1 AND day BETWEEN $2 AND $3",
      [tenantId, from.toString(), to.toString()],
    );
    return rows[0]!;
  }
  async activities(
    tenantId: string,
    start: Temporal.Instant,
    end: Temporal.Instant,
  ) {
    const { rows } = await this.db.query<ActivityFigures>(
      `SELECT a.id, a.name_gl AS name, f.name AS "facilityName", a.places,
        (SELECT count(*) FROM activity_enrolments e WHERE e.tenant_id=a.tenant_id AND e.activity_id=a.id AND e.status='enrolled')::int AS enrolled,
        (SELECT count(*) FROM activity_enrolments e WHERE e.tenant_id=a.tenant_id AND e.activity_id=a.id AND e.status='waiting')::int AS waiting,
        count(*) FILTER (WHERE x.status='active')::int AS sessions,
        count(*) FILTER (WHERE x.status='cancelled')::int AS "cancelledSessions",
        COALESCE(sum((SELECT count(*) FROM activity_attendance t WHERE t.tenant_id=x.tenant_id AND t.session_id=x.id AND t.status='present')) FILTER (WHERE x.status='active'), 0)::int AS present,
        COALESCE(sum((SELECT count(*) FROM activity_attendance t WHERE t.tenant_id=x.tenant_id AND t.session_id=x.id AND t.status='absent')) FILTER (WHERE x.status='active'), 0)::int AS absent
      FROM activities a
      JOIN facilities f ON f.tenant_id=a.tenant_id AND f.id=a.facility_id
      JOIN activity_sessions x ON x.tenant_id=a.tenant_id AND x.activity_id=a.id
      WHERE a.tenant_id=$1 AND a.status IN ('published','cancelled') AND x.starts_at>=$2 AND x.starts_at<$3
      GROUP BY a.id, f.name ORDER BY a.name_gl, a.id`,
      [tenantId, start.toString(), end.toString()],
    );
    return rows;
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
      "SELECT b.facility_id AS \"facilityId\", b.resource_id AS \"resourceId\", b.starts_at AS start, b.ends_at AS end, b.status, ARRAY(SELECT coalesce(part.id,r.id) FROM resources r LEFT JOIN resources part ON part.tenant_id=r.tenant_id AND part.parent_id=r.id WHERE r.tenant_id=b.tenant_id AND r.id=b.resource_id ORDER BY coalesce(part.id,r.id)) AS \"unitIds\" FROM bookings b WHERE b.tenant_id=$1 AND b.starts_at<$3 AND b.ends_at>$2 UNION ALL SELECT a.facility_id, a.resource_id, s.starts_at, s.ends_at, 'season', ARRAY(SELECT coalesce(part.id,r.id) FROM resources r LEFT JOIN resources part ON part.tenant_id=r.tenant_id AND part.parent_id=r.id WHERE r.tenant_id=a.tenant_id AND r.id=a.resource_id ORDER BY coalesce(part.id,r.id)) FROM season_occurrences s JOIN season_allocations a ON a.tenant_id=s.tenant_id AND a.id=s.allocation_id WHERE s.tenant_id=$1 AND s.status='active' AND s.starts_at<$3 AND s.ends_at>$2 UNION ALL SELECT a.facility_id, a.resource_id, x.starts_at, x.ends_at, 'activity', ARRAY(SELECT coalesce(part.id,r.id) FROM resources r LEFT JOIN resources part ON part.tenant_id=r.tenant_id AND part.parent_id=r.id WHERE r.tenant_id=a.tenant_id AND r.id=a.resource_id ORDER BY coalesce(part.id,r.id)) FROM activity_sessions x JOIN activities a ON a.tenant_id=x.tenant_id AND a.id=x.activity_id WHERE x.tenant_id=$1 AND x.status='active' AND x.starts_at<$3 AND x.ends_at>$2",
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
