// SPDX-License-Identifier: AGPL-3.0-or-later
import { Injectable } from "@nestjs/common";
import { Temporal } from "@js-temporal/polyfill";
import { Database } from "../../../../shared/infrastructure/database";
import { EnrolmentRepository } from "../../domain/enrolment.repository";
import type {
  ActivityEnrolment,
  EnrolmentStatus,
} from "../../domain/enrolment.entity";
import type {
  ManagedEnrolment,
  MyEnrolment,
} from "../../domain/enrolment.read-model";
const instant = (value: string) => Temporal.Instant.from(value);
const optionalInstant = (value: string | null) =>
  value === null ? null : instant(value);
interface EnrolmentRow {
  id: string;
  tenantId: string;
  activityId: string;
  userId: string;
  status: EnrolmentStatus;
  createdAt: string;
  enrolledAt: string | null;
  endedAt: string | null;
  removalReason: string | null;
}
const columns = `e.id, e.tenant_id AS "tenantId", e.activity_id AS "activityId", e.user_id AS "userId",
  e.status, e.created_at AS "createdAt", e.enrolled_at AS "enrolledAt", e.ended_at AS "endedAt",
  e.removal_reason AS "removalReason"`;
/** Place in the waiting list of an enrolment `e`, from 1; null unless waiting. */
const position = `CASE WHEN e.status='waiting' THEN (SELECT count(*) FROM activity_enrolments q
  WHERE q.tenant_id=e.tenant_id AND q.activity_id=e.activity_id AND q.status='waiting'
    AND (q.created_at, q.id) <= (e.created_at, e.id))::int END`;
/** Open enrolments first (enrolled, then waiting in order), then closed ones, newest first. */
const order = `array_position(ARRAY['enrolled','waiting','left','removed','cancelled'], e.status),
  CASE WHEN e.status IN ('enrolled','waiting') THEN e.created_at END ASC,
  e.ended_at DESC, e.id`;
function enrolment(row: EnrolmentRow): ActivityEnrolment {
  return {
    id: row.id,
    tenantId: row.tenantId,
    activityId: row.activityId,
    userId: row.userId,
    status: row.status,
    createdAt: instant(row.createdAt),
    enrolledAt: optionalInstant(row.enrolledAt),
    endedAt: optionalInstant(row.endedAt),
    removalReason: row.removalReason,
  };
}
type ManagedRow = EnrolmentRow & {
  position: number | null;
  name: string;
  email: string | null;
};
function managed(row: ManagedRow): ManagedEnrolment {
  const {
    tenantId: _tenantId,
    activityId: _activityId,
    ...value
  } = enrolment(row);
  return {
    ...value,
    position: row.position,
    name: row.name,
    email: row.email,
  };
}
const managedQuery = (
  where: string,
  extra = "",
) => `SELECT ${columns}, ${position} AS position,
  u.display_name AS name, CASE WHEN u.deleted_at IS NULL THEN u.email END AS email${extra}
  FROM activity_enrolments e JOIN users u ON u.tenant_id=e.tenant_id AND u.id=e.user_id
  WHERE e.tenant_id=$1 AND e.activity_id=$2 ${where}`;
@Injectable()
export class PostgresEnrolmentRepository extends EnrolmentRepository {
  constructor(private readonly db: Database) {
    super();
  }
  async find(tenantId: string, id: string) {
    const { rows } = await this.db.query<EnrolmentRow>(
      `SELECT ${columns} FROM activity_enrolments e WHERE e.tenant_id=$1 AND e.id=$2`,
      [tenantId, id],
    );
    return rows[0] ? enrolment(rows[0]) : null;
  }
  async findOpen(tenantId: string, activityId: string, userId: string) {
    const { rows } = await this.db.query<EnrolmentRow>(
      `SELECT ${columns} FROM activity_enrolments e
      WHERE e.tenant_id=$1 AND e.activity_id=$2 AND e.user_id=$3 AND e.status IN ('enrolled','waiting')`,
      [tenantId, activityId, userId],
    );
    return rows[0] ? enrolment(rows[0]) : null;
  }
  async open(tenantId: string, activityId: string) {
    const { rows } = await this.db.query<EnrolmentRow>(
      `SELECT ${columns} FROM activity_enrolments e
      WHERE e.tenant_id=$1 AND e.activity_id=$2 AND e.status IN ('enrolled','waiting')
      ORDER BY ${order}`,
      [tenantId, activityId],
    );
    return rows.map(enrolment);
  }
  async add(value: ActivityEnrolment) {
    await this.db.query(
      `INSERT INTO activity_enrolments (id,tenant_id,activity_id,user_id,status,created_at,enrolled_at,ended_at,removal_reason)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
      [
        value.id,
        value.tenantId,
        value.activityId,
        value.userId,
        value.status,
        value.createdAt.toString(),
        value.enrolledAt?.toString() ?? null,
        value.endedAt?.toString() ?? null,
        value.removalReason,
      ],
    );
  }
  async save(value: ActivityEnrolment) {
    await this.db.query(
      `UPDATE activity_enrolments SET status=$3, enrolled_at=$4, ended_at=$5, removal_reason=$6
      WHERE tenant_id=$1 AND id=$2`,
      [
        value.tenantId,
        value.id,
        value.status,
        value.enrolledAt?.toString() ?? null,
        value.endedAt?.toString() ?? null,
        value.removalReason,
      ],
    );
  }
  async openOfUser(tenantId: string, userId: string) {
    const { rows } = await this.db.query<EnrolmentRow>(
      `SELECT ${columns} FROM activity_enrolments e
      WHERE e.tenant_id=$1 AND e.user_id=$2 AND e.status IN ('enrolled','waiting')
      ORDER BY e.created_at`,
      [tenantId, userId],
    );
    return rows.map(enrolment);
  }
  async mine(tenantId: string, userId: string, now: Temporal.Instant) {
    const { rows } = await this.db.query<
      EnrolmentRow & {
        position: number | null;
        activityNameGl: string;
        activityNameEs: string;
        activityStatus: MyEnrolment["activityStatus"];
        facilityId: string;
        facilityName: string;
        resourceName: string;
        nextSession: string | null;
        cancelledSessions: number;
      }
    >(
      `SELECT ${columns}, ${position} AS position,
        a.name_gl AS "activityNameGl", a.name_es AS "activityNameEs", a.status AS "activityStatus",
        a.facility_id AS "facilityId", f.name AS "facilityName", r.name AS "resourceName",
        (SELECT min(x.starts_at) FROM activity_sessions x WHERE x.tenant_id=a.tenant_id
          AND x.activity_id=a.id AND x.status='active' AND x.starts_at>$3) AS "nextSession",
        (SELECT count(*) FROM activity_sessions x WHERE x.tenant_id=a.tenant_id
          AND x.activity_id=a.id AND x.status='cancelled' AND x.starts_at>e.created_at)::int AS "cancelledSessions"
      FROM activity_enrolments e
      JOIN activities a ON a.tenant_id=e.tenant_id AND a.id=e.activity_id
      JOIN facilities f ON f.tenant_id=a.tenant_id AND f.id=a.facility_id
      JOIN resources r ON r.tenant_id=a.tenant_id AND r.id=a.resource_id
      WHERE e.tenant_id=$1 AND e.user_id=$2
      ORDER BY ${order}`,
      [tenantId, userId, now.toString()],
    );
    return rows.map((row): MyEnrolment => ({
      id: row.id,
      activityId: row.activityId,
      activityName: { gl: row.activityNameGl, es: row.activityNameEs },
      activityStatus: row.activityStatus,
      facilityId: row.facilityId,
      facilityName: row.facilityName,
      resourceName: row.resourceName,
      status: row.status,
      position: row.position,
      createdAt: instant(row.createdAt),
      enrolledAt: optionalInstant(row.enrolledAt),
      endedAt: optionalInstant(row.endedAt),
      nextSession: optionalInstant(row.nextSession),
      cancelledSessions: row.cancelledSessions,
    }));
  }
  async page(args: Parameters<EnrolmentRepository["page"]>[0]) {
    const status = args.status ? [args.status] : ["enrolled", "waiting"];
    const { rows } = await this.db.query<ManagedRow & { total: string }>(
      `${managedQuery(
        "AND e.status = ANY($3::text[])",
        ", count(*) OVER() AS total",
      )} ORDER BY ${order} LIMIT $4 OFFSET $5`,
      [
        args.tenantId,
        args.activityId,
        status,
        args.size,
        (args.page - 1) * args.size,
      ],
    );
    let total = rows[0] ? Number(rows[0].total) : 0;
    // A page past the end still reports how many there are.
    if (!rows[0] && args.page > 1) {
      const counted = await this.db.query<{ total: string }>(
        `SELECT count(*) AS total FROM activity_enrolments
        WHERE tenant_id=$1 AND activity_id=$2 AND status = ANY($3::text[])`,
        [args.tenantId, args.activityId, status],
      );
      total = Number(counted.rows[0]?.total ?? 0);
    }
    return {
      items: rows.map(managed),
      total,
      page: args.page,
      pageSize: args.size,
    };
  }
  async all(tenantId: string, activityId: string) {
    const { rows } = await this.db.query<ManagedRow>(
      `${managedQuery("")} ORDER BY ${order}`,
      [tenantId, activityId],
    );
    return rows.map(managed);
  }
  async activityExists(tenantId: string, id: string) {
    const { rowCount } = await this.db.query(
      "SELECT 1 FROM activities WHERE tenant_id=$1 AND id=$2",
      [tenantId, id],
    );
    return (rowCount ?? 0) > 0;
  }
  async hasAny(tenantId: string, activityId: string) {
    const { rowCount } = await this.db.query(
      "SELECT 1 FROM activity_enrolments WHERE tenant_id=$1 AND activity_id=$2 LIMIT 1",
      [tenantId, activityId],
    );
    return (rowCount ?? 0) > 0;
  }
  async sessions(tenantId: string, ids: readonly string[]) {
    if (!ids.length) return [];
    const { rows } = await this.db.query<{
      id: string;
      activityId: string;
      start: string;
    }>(
      `SELECT id, activity_id AS "activityId", starts_at AS start FROM activity_sessions
      WHERE tenant_id=$1 AND id = ANY($2::uuid[]) ORDER BY starts_at`,
      [tenantId, [...ids]],
    );
    return rows.map((row) => ({ ...row, start: instant(row.start) }));
  }
}
