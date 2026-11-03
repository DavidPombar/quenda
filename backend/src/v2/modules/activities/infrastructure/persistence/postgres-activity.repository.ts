// SPDX-License-Identifier: AGPL-3.0-or-later
import { Injectable } from "@nestjs/common";
import { Temporal } from "@js-temporal/polyfill";
import { Database } from "../../../../shared/infrastructure/database";
import {
  ActivityFacility,
  ActivityFilters,
  ActivityRepository,
  ActivityResource,
} from "../../domain/activity.repository";
import type {
  Activity,
  ActivityPrice,
  ActivitySession,
} from "../../domain/activity.entity";
import type { ClashReason } from "../../domain/activity-schedule";
import type {
  ManagedActivity,
  PublicActivity,
} from "../../domain/activity.read-model";
import type { SportArt } from "../../../facilities/domain/sport.entity";
const instant = (value: string) => Temporal.Instant.from(value);
const optionalInstant = (value: string | null) =>
  value === null ? null : instant(value);
const PRICE_ORDER =
  "ARRAY['general','resident','family','local_club','minor','large_family','disability','senior']";
/** Columns of an activity with its place and sport; `a` is the activity, `$now` its parameter. */
const columns = (
  now: string,
) => `a.id, a.tenant_id AS "tenantId", a.facility_id AS "facilityId",
  a.resource_id AS "resourceId", a.sport, a.name_gl AS "nameGl", a.name_es AS "nameEs",
  a.description_gl AS "descriptionGl", a.description_es AS "descriptionEs",
  a.weekdays, to_char(a.starts_local, 'HH24:MI') AS "startsLocal", to_char(a.ends_local, 'HH24:MI') AS "endsLocal",
  to_char(a.starts_on, 'YYYY-MM-DD') AS "startsOn", to_char(a.ends_on, 'YYYY-MM-DD') AS "endsOn",
  ARRAY(SELECT to_char(e, 'YYYY-MM-DD') FROM unnest(a.exceptions) AS e ORDER BY e) AS exceptions,
  a.schedule, a.places, a.min_age AS "minAge", a.max_age AS "maxAge",
  to_char(a.enrolment_opens_on, 'YYYY-MM-DD') AS "enrolmentOpensOn",
  to_char(a.enrolment_closes_on, 'YYYY-MM-DD') AS "enrolmentClosesOn",
  a.status, a.cancellation_reason AS "cancellationReason", a.created_at AS "createdAt",
  a.published_at AS "publishedAt", a.cancelled_at AS "cancelledAt",
  COALESCE((SELECT json_agg(json_build_object('category', p.category, 'priceCents', p.price_cents)
    ORDER BY array_position(${PRICE_ORDER}, p.category))
    FROM activity_prices p WHERE p.tenant_id=a.tenant_id AND p.activity_id=a.id), '[]') AS prices,
  f.name AS "facilityName", f.address AS "facilityAddress", r.name AS "resourceName",
  s.name_gl AS "sportNameGl", s.name_es AS "sportNameEs", s.art AS "sportArt",
  (SELECT count(*) FROM activity_sessions x WHERE x.tenant_id=a.tenant_id AND x.activity_id=a.id
    AND x.status='active' AND x.starts_at>${now})::int AS "upcomingSessions",
  (SELECT min(x.starts_at) FROM activity_sessions x WHERE x.tenant_id=a.tenant_id AND x.activity_id=a.id
    AND x.status='active' AND x.starts_at>${now}) AS "nextSession",
  (SELECT count(*) FROM activity_enrolments e WHERE e.tenant_id=a.tenant_id AND e.activity_id=a.id
    AND e.status='enrolled')::int AS enrolled,
  (SELECT count(*) FROM activity_enrolments e WHERE e.tenant_id=a.tenant_id AND e.activity_id=a.id
    AND e.status='waiting')::int AS waiting`;
const joins = `JOIN facilities f ON f.tenant_id=a.tenant_id AND f.id=a.facility_id
  JOIN resources r ON r.tenant_id=a.tenant_id AND r.id=a.resource_id
  JOIN sports s ON s.tenant_id=a.tenant_id AND s.code=a.sport`;
interface ActivityRow {
  id: string;
  tenantId: string;
  facilityId: string;
  resourceId: string;
  sport: string;
  nameGl: string;
  nameEs: string;
  descriptionGl: string;
  descriptionEs: string;
  weekdays: number[];
  startsLocal: string;
  endsLocal: string;
  startsOn: string;
  endsOn: string;
  exceptions: string[];
  schedule: string;
  places: number;
  minAge: number | null;
  maxAge: number | null;
  enrolmentOpensOn: string;
  enrolmentClosesOn: string;
  status: Activity["status"];
  cancellationReason: string | null;
  createdAt: string;
  publishedAt: string | null;
  cancelledAt: string | null;
  prices: ActivityPrice[];
  facilityName: string;
  facilityAddress: string;
  resourceName: string;
  sportNameGl: string;
  sportNameEs: string;
  sportArt: SportArt;
  upcomingSessions: number;
  nextSession: string | null;
  enrolled: number;
  waiting: number;
}
function activity(row: ActivityRow): Activity {
  return {
    id: row.id,
    tenantId: row.tenantId,
    facilityId: row.facilityId,
    resourceId: row.resourceId,
    sport: row.sport,
    name: { gl: row.nameGl, es: row.nameEs },
    description: { gl: row.descriptionGl, es: row.descriptionEs },
    rule: {
      weekdays: row.weekdays.map(Number),
      startsLocal: row.startsLocal,
      endsLocal: row.endsLocal,
      startsOn: row.startsOn,
      endsOn: row.endsOn,
      exceptions: row.exceptions,
    },
    schedule: row.schedule,
    places: row.places,
    minAge: row.minAge,
    maxAge: row.maxAge,
    enrolmentOpensOn: row.enrolmentOpensOn,
    enrolmentClosesOn: row.enrolmentClosesOn,
    prices: row.prices,
    status: row.status,
    cancellationReason: row.cancellationReason,
    createdAt: instant(row.createdAt),
    publishedAt: optionalInstant(row.publishedAt),
    cancelledAt: optionalInstant(row.cancelledAt),
  };
}
function managed(row: ActivityRow): ManagedActivity {
  return {
    ...activity(row),
    facilityName: row.facilityName,
    facilityAddress: row.facilityAddress,
    resourceName: row.resourceName,
    sportName: { gl: row.sportNameGl, es: row.sportNameEs },
    sportArt: row.sportArt,
    upcomingSessions: row.upcomingSessions,
    nextSession: optionalInstant(row.nextSession),
    enrolled: row.enrolled,
    waiting: row.waiting,
  };
}
function published(row: ActivityRow): Omit<PublicActivity, "enrolment"> {
  const {
    tenantId: _tenantId,
    schedule: _schedule,
    createdAt: _createdAt,
    publishedAt: _publishedAt,
    cancelledAt: _cancelledAt,
    upcomingSessions: _upcoming,
    enrolled,
    ...value
  } = managed(row);
  return { ...value, freePlaces: Math.max(0, value.places - enrolled) };
}
interface SessionRow {
  id: string;
  activityId: string;
  start: string;
  end: string;
  status: ActivitySession["status"];
  cancellationReason: string | null;
}
const sessionColumns = `x.id, x.activity_id AS "activityId", x.starts_at AS start, x.ends_at AS "end",
  x.status, x.cancellation_reason AS "cancellationReason"`;
function session(row: SessionRow): ActivitySession {
  return {
    id: row.id,
    activityId: row.activityId,
    start: instant(row.start),
    end: instant(row.end),
    status: row.status,
    cancellationReason: row.cancellationReason,
  };
}
@Injectable()
export class PostgresActivityRepository extends ActivityRepository {
  constructor(private readonly db: Database) {
    super();
  }
  async lockFacility(tenantId: string, facilityId: string) {
    const { rows } = await this.db.query<ActivityFacility>(
      `SELECT id, status, opening_calendar AS "openingCalendar", follows_municipal_holidays AS "followsMunicipalHolidays"
      FROM facilities WHERE tenant_id=$1 AND id=$2 FOR UPDATE`,
      [tenantId, facilityId],
    );
    return rows[0] ?? null;
  }
  async resources(tenantId: string, facilityId: string) {
    return (
      await this.db.query<ActivityResource>(
        'SELECT id, parent_id AS "parentId", active FROM resources WHERE tenant_id=$1 AND facility_id=$2',
        [tenantId, facilityId],
      )
    ).rows;
  }
  async sportExists(tenantId: string, code: string) {
    const { rowCount } = await this.db.query(
      "SELECT 1 FROM sports WHERE tenant_id=$1 AND code=$2 AND NOT hidden",
      [tenantId, code],
    );
    return (rowCount ?? 0) > 0;
  }
  async find(tenantId: string, id: string) {
    const { rows } = await this.db.query<ActivityRow>(
      `SELECT ${columns("now()")} FROM activities a ${joins} WHERE a.tenant_id=$1 AND a.id=$2 FOR UPDATE OF a`,
      [tenantId, id],
    );
    return rows[0] ? activity(rows[0]) : null;
  }
  async save(value: Activity) {
    await this.db.query(
      `INSERT INTO activities (id,tenant_id,facility_id,resource_id,sport,name_gl,name_es,description_gl,description_es,
        weekdays,starts_local,ends_local,starts_on,ends_on,exceptions,schedule,places,min_age,max_age,
        enrolment_opens_on,enrolment_closes_on,status,cancellation_reason,created_at,published_at,cancelled_at)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10::smallint[],$11,$12,$13,$14,$15::date[],$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26)
      ON CONFLICT (id) DO UPDATE SET facility_id=$3, resource_id=$4, sport=$5, name_gl=$6, name_es=$7,
        description_gl=$8, description_es=$9, weekdays=$10::smallint[], starts_local=$11, ends_local=$12,
        starts_on=$13, ends_on=$14, exceptions=$15::date[], schedule=$16, places=$17, min_age=$18, max_age=$19,
        enrolment_opens_on=$20, enrolment_closes_on=$21, status=$22, cancellation_reason=$23,
        published_at=$25, cancelled_at=$26
      WHERE activities.tenant_id=$2`,
      [
        value.id,
        value.tenantId,
        value.facilityId,
        value.resourceId,
        value.sport,
        value.name.gl,
        value.name.es,
        value.description.gl,
        value.description.es,
        value.rule.weekdays,
        value.rule.startsLocal,
        value.rule.endsLocal,
        value.rule.startsOn,
        value.rule.endsOn,
        value.rule.exceptions,
        value.schedule,
        value.places,
        value.minAge,
        value.maxAge,
        value.enrolmentOpensOn,
        value.enrolmentClosesOn,
        value.status,
        value.cancellationReason,
        value.createdAt.toString(),
        value.publishedAt?.toString() ?? null,
        value.cancelledAt?.toString() ?? null,
      ],
    );
    await this.db.query(
      "DELETE FROM activity_prices WHERE tenant_id=$1 AND activity_id=$2",
      [value.tenantId, value.id],
    );
    if (value.prices.length)
      await this.db.query(
        "INSERT INTO activity_prices (tenant_id,activity_id,category,price_cents) SELECT $1,$2,category,price FROM unnest($3::text[],$4::int[]) AS p(category,price)",
        [
          value.tenantId,
          value.id,
          value.prices.map((price) => price.category),
          value.prices.map((price) => price.priceCents),
        ],
      );
  }
  async clashes(args: Parameters<ActivityRepository["clashes"]>[0]) {
    if (!args.intervals.length) return [];
    // One row per clashing interval; a booking is reported before a club, an offer or an activity.
    const { rows } = await this.db.query<{
      index: number;
      reason: Exclude<ClashReason, "closed">;
    }>(
      `SELECT DISTINCT ON (i.n) (i.n - 1)::int AS index,
        CASE WHEN u.booking_id IS NOT NULL THEN 'booking'
          WHEN u.occurrence_id IS NOT NULL THEN 'season'
          WHEN u.waitlist_entry_id IS NOT NULL THEN 'waitlist_hold'
          ELSE 'activity' END AS reason
      FROM unnest($3::timestamptz[], $4::timestamptz[]) WITH ORDINALITY AS i(starts_at, ends_at, n)
      JOIN booking_units u ON u.tenant_id=$1 AND u.unit_id = ANY($2::uuid[])
        AND u.starts_at<i.ends_at AND u.ends_at>i.starts_at
      LEFT JOIN activity_sessions own ON own.tenant_id=u.tenant_id AND own.id=u.session_id
      WHERE own.activity_id IS DISTINCT FROM $5::uuid
      ORDER BY i.n, u.booking_id IS NULL, u.occurrence_id IS NULL, u.waitlist_entry_id IS NULL`,
      [
        args.tenantId,
        [...args.unitIds],
        args.intervals.map((interval) => interval.start.toString()),
        args.intervals.map((interval) => interval.end.toString()),
        args.activityId,
      ],
    );
    return rows;
  }
  async replaceUpcomingSessions(
    args: Parameters<ActivityRepository["replaceUpcomingSessions"]>[0],
  ) {
    const from = args.from.toString();
    await this.db.query(
      `DELETE FROM booking_units u USING activity_sessions x
      WHERE u.tenant_id=$1 AND u.session_id=x.id AND x.tenant_id=$1 AND x.activity_id=$2 AND x.starts_at>$3`,
      [args.tenantId, args.activityId, from],
    );
    const { rows } = await this.db.query<{
      start: string;
      end: string;
      status: ActivitySession["status"];
    }>(
      `DELETE FROM activity_sessions WHERE tenant_id=$1 AND activity_id=$2 AND starts_at>$3
      RETURNING starts_at AS start, ends_at AS "end", status`,
      [args.tenantId, args.activityId, from],
    );
    if (args.sessions.length) {
      const values = [
        args.tenantId,
        args.activityId,
        args.sessions.map((item) => item.id),
        args.sessions.map((item) => item.start.toString()),
        args.sessions.map((item) => item.end.toString()),
      ];
      await this.db.query(
        `INSERT INTO activity_sessions (id,tenant_id,activity_id,starts_at,ends_at,status)
        SELECT id,$1,$2,starts_at,ends_at,'active' FROM unnest($3::uuid[],$4::timestamptz[],$5::timestamptz[]) AS s(id,starts_at,ends_at)`,
        values,
      );
      // The caller holds the facility lock and checked the units; the exclusion constraint backs it up.
      await this.db.query(
        `INSERT INTO booking_units (tenant_id,session_id,unit_id,starts_at,ends_at)
        SELECT $1,s.id,unit,s.starts_at,s.ends_at FROM unnest($2::uuid[],$3::timestamptz[],$4::timestamptz[]) AS s(id,starts_at,ends_at)
        CROSS JOIN unnest($5::uuid[]) AS unit`,
        [args.tenantId, ...values.slice(2), [...args.unitIds]],
      );
    }
    return rows
      .filter((row) => row.status === "active")
      .map((row) => ({ start: instant(row.start), end: instant(row.end) }));
  }
  async findSession(tenantId: string, id: string) {
    const { rows } = await this.db.query<
      SessionRow & { facilityId: string; activityStatus: Activity["status"] }
    >(
      `SELECT ${sessionColumns}, a.facility_id AS "facilityId", a.status AS "activityStatus"
      FROM activity_sessions x JOIN activities a ON a.tenant_id=x.tenant_id AND a.id=x.activity_id
      WHERE x.tenant_id=$1 AND x.id=$2 FOR UPDATE OF x`,
      [tenantId, id],
    );
    const row = rows[0];
    return row
      ? {
          ...session(row),
          facilityId: row.facilityId,
          activityStatus: row.activityStatus,
        }
      : null;
  }
  async cancelSessions(
    args: Parameters<ActivityRepository["cancelSessions"]>[0],
  ) {
    const { rows } = await this.db.query<{
      id: string;
      start: string;
      end: string;
    }>(
      `UPDATE activity_sessions SET status='cancelled', cancellation_reason=$4
      WHERE tenant_id=$1 AND activity_id=$2 AND status='active' AND starts_at>$3
        AND ($5::uuid[] IS NULL OR id = ANY($5::uuid[]))
      RETURNING id, starts_at AS start, ends_at AS "end"`,
      [
        args.tenantId,
        args.activityId,
        args.from.toString(),
        args.reason,
        args.ids ? [...args.ids] : null,
      ],
    );
    await this.db.query(
      "DELETE FROM booking_units WHERE tenant_id=$1 AND session_id = ANY($2::uuid[])",
      [args.tenantId, rows.map((row) => row.id)],
    );
    return rows.map((row) => ({
      start: instant(row.start),
      end: instant(row.end),
    }));
  }
  async list(tenantId: string, now: Temporal.Instant) {
    const { rows } = await this.db.query<ActivityRow>(
      `SELECT ${columns("$2")} FROM activities a ${joins} WHERE a.tenant_id=$1
      ORDER BY array_position(ARRAY['published','draft','cancelled'], a.status), a.starts_on, a.name_gl, a.id`,
      [tenantId, now.toString()],
    );
    return rows.map(managed);
  }
  private async sessions(
    tenantId: string,
    activityId: string,
    after: Temporal.Instant | null,
  ) {
    const { rows } = await this.db.query<SessionRow>(
      `SELECT ${sessionColumns} FROM activity_sessions x
      WHERE x.tenant_id=$1 AND x.activity_id=$2 AND ($3::timestamptz IS NULL OR x.ends_at>$3)
      ORDER BY x.starts_at`,
      [tenantId, activityId, after?.toString() ?? null],
    );
    return rows.map(session);
  }
  async details(tenantId: string, id: string, now: Temporal.Instant) {
    const { rows } = await this.db.query<ActivityRow>(
      `SELECT ${columns("$3")} FROM activities a ${joins} WHERE a.tenant_id=$1 AND a.id=$2`,
      [tenantId, id, now.toString()],
    );
    if (!rows[0]) return null;
    return {
      ...managed(rows[0]),
      sessions: await this.sessions(tenantId, id, null),
    };
  }
  async search(args: {
    tenantId: string;
    filters: ActivityFilters;
    today: string;
    now: Temporal.Instant;
    page: number;
    size: number;
  }) {
    const { filters } = args;
    const { rows } = await this.db.query<ActivityRow & { total: string }>(
      `SELECT ${columns("$2")}, count(*) OVER() AS total FROM activities a ${joins}
      WHERE a.tenant_id=$1 AND a.status='published' AND a.ends_on>=$3::date
        AND ($4::text IS NULL OR a.sport=$4)
        AND ($5::uuid IS NULL OR a.facility_id=$5)
        AND ($6::int IS NULL OR ((a.min_age IS NULL OR a.min_age<=$6) AND (a.max_age IS NULL OR a.max_age>=$6)))
        AND (NOT $7::boolean OR (a.enrolment_opens_on<=$3::date AND a.enrolment_closes_on>=$3::date))
      ORDER BY "nextSession" NULLS LAST, a.name_gl, a.id LIMIT $8 OFFSET $9`,
      [
        args.tenantId,
        args.now.toString(),
        args.today,
        filters.sport ?? null,
        filters.facilityId ?? null,
        filters.age ?? null,
        filters.openOnly ?? false,
        args.size,
        (args.page - 1) * args.size,
      ],
    );
    let total = rows[0] ? Number(rows[0].total) : 0;
    // A page past the end still reports how many there are.
    if (!rows.length && args.page > 1)
      total = (await this.search({ ...args, page: 1, size: 1 })).total;
    return { items: rows.map(published), total };
  }
  async publicDetails(tenantId: string, id: string, now: Temporal.Instant) {
    const { rows } = await this.db.query<ActivityRow>(
      `SELECT ${columns("$3")} FROM activities a ${joins}
      WHERE a.tenant_id=$1 AND a.id=$2 AND a.status IN ('published','cancelled')`,
      [tenantId, id, now.toString()],
    );
    if (!rows[0]) return null;
    return {
      ...published(rows[0]),
      sessions: await this.sessions(tenantId, id, now),
    };
  }
}
