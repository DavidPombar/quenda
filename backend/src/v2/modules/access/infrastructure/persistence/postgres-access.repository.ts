// SPDX-License-Identifier: AGPL-3.0-or-later
import { Injectable } from "@nestjs/common";
import { Temporal } from "@js-temporal/polyfill";
import { Database } from "../../../../shared/infrastructure/database";
import { AccessRepository } from "../../domain/access.repository";
import {
  AccessDayBooking,
  AttendanceStatus,
  PassTarget,
} from "../../domain/access.read-model";
import { accessCode } from "../../application/access-code";
interface DayRow {
  id: string;
  facilityId: string;
  sequence: number;
  openingCalendar: string;
  facilityName: string;
  start: string;
  end: string;
  status: AccessDayBooking["status"];
  displayName: string | null;
  checkedInAt: string | null;
}
// Demo names read "Alex · conta de proba"; staff see only "Alex".
function firstName(displayName: string | null) {
  return (displayName ?? "").split("·")[0].trim().split(/\s+/)[0] ?? "";
}
@Injectable()
export class PostgresAccessRepository extends AccessRepository {
  constructor(private readonly db: Database) {
    super();
  }
  async passTarget(tenantId: string, userId: string, bookingId: string) {
    const { rows } = await this.db.query<
      Omit<PassTarget, "start" | "end"> & { start: string; end: string }
    >(
      'SELECT b.id AS "bookingId", b.facility_id AS "facilityId", b.sequence, b.status, b.starts_at AS start, b.ends_at AS "end", f.opening_calendar AS "openingCalendar" FROM bookings b JOIN facilities f ON f.tenant_id=b.tenant_id AND f.id=b.facility_id WHERE b.tenant_id=$1 AND b.user_id=$2 AND b.id=$3',
      [tenantId, userId, bookingId],
    );
    const row = rows[0];
    return row
      ? {
          ...row,
          start: Temporal.Instant.from(row.start),
          end: Temporal.Instant.from(row.end),
        }
      : null;
  }
  async day(tenantId: string, from: Temporal.Instant, to: Temporal.Instant) {
    const { rows } = await this.db.query<DayRow>(
      'SELECT b.id, b.sequence, f.opening_calendar AS "openingCalendar", b.facility_id AS "facilityId", f.name AS "facilityName", b.starts_at AS start, b.ends_at AS "end", b.status, u.display_name AS "displayName", c.checked_in_at AS "checkedInAt" FROM bookings b JOIN facilities f ON f.tenant_id=b.tenant_id AND f.id=b.facility_id LEFT JOIN users u ON u.tenant_id=b.tenant_id AND u.id=b.user_id LEFT JOIN check_ins c ON c.tenant_id=b.tenant_id AND c.booking_id=b.id AND c.booking_sequence=b.sequence WHERE b.tenant_id=$1 AND b.starts_at>=$2 AND b.starts_at<$3 ORDER BY b.starts_at, f.name',
      [tenantId, from.toString(), to.toString()],
    );
    return rows.map((row) => ({
      id: row.id,
      sequence: row.sequence,
      openingCalendar: row.openingCalendar,
      code: accessCode(row.id),
      facilityId: row.facilityId,
      facilityName: row.facilityName,
      start: Temporal.Instant.from(row.start),
      end: Temporal.Instant.from(row.end),
      status: row.status,
      holder: firstName(row.displayName),
      checkedInAt: row.checkedInAt
        ? Temporal.Instant.from(row.checkedInAt)
        : null,
    }));
  }
  async sessions(
    tenantId: string,
    from: Temporal.Instant,
    to: Temporal.Instant,
  ) {
    const { rows } = await this.db.query<{
      id: string;
      activityId: string;
      nameGl: string;
      nameEs: string;
      facilityId: string;
      facilityName: string;
      resourceName: string;
      openingCalendar: string;
      start: string;
      end: string;
      people: {
        enrolmentId: string;
        adult: string | null;
        dependant: string | null;
        attendance: AttendanceStatus | null;
      }[];
    }>(
      `SELECT x.id, a.id AS "activityId", a.name_gl AS "nameGl", a.name_es AS "nameEs",
        a.facility_id AS "facilityId", f.name AS "facilityName", r.name AS "resourceName",
        f.opening_calendar AS "openingCalendar", x.starts_at AS start, x.ends_at AS "end",
        COALESCE((SELECT json_agg(json_build_object('enrolmentId', e.id, 'adult', u.display_name,
            'dependant', d.first_name, 'attendance', t.status) ORDER BY COALESCE(d.first_name, u.display_name), e.id)
          FROM activity_enrolments e
          JOIN users u ON u.tenant_id=e.tenant_id AND u.id=e.user_id
          LEFT JOIN dependants d ON d.tenant_id=e.tenant_id AND d.id=e.dependant_id
          LEFT JOIN activity_attendance t ON t.tenant_id=e.tenant_id AND t.enrolment_id=e.id AND t.session_id=x.id
          WHERE e.tenant_id=a.tenant_id AND e.activity_id=a.id AND e.status='enrolled'), '[]') AS people
      FROM activity_sessions x
      JOIN activities a ON a.tenant_id=x.tenant_id AND a.id=x.activity_id
      JOIN facilities f ON f.tenant_id=a.tenant_id AND f.id=a.facility_id
      JOIN resources r ON r.tenant_id=a.tenant_id AND r.id=a.resource_id
      WHERE x.tenant_id=$1 AND x.status='active' AND a.status='published'
        AND x.starts_at>=$2 AND x.starts_at<$3
      ORDER BY x.starts_at, a.name_gl`,
      [tenantId, from.toString(), to.toString()],
    );
    return rows.map((row) => ({
      id: row.id,
      activityId: row.activityId,
      activityName: { gl: row.nameGl, es: row.nameEs },
      facilityId: row.facilityId,
      facilityName: row.facilityName,
      resourceName: row.resourceName,
      openingCalendar: row.openingCalendar,
      start: Temporal.Instant.from(row.start),
      end: Temporal.Instant.from(row.end),
      people: row.people.map((person) => ({
        enrolmentId: person.enrolmentId,
        name: person.dependant ?? firstName(person.adult),
        attendance: person.attendance,
      })),
    }));
  }
  async findForAttendance(
    tenantId: string,
    sessionId: string,
    enrolmentId: string,
  ) {
    const { rows } = await this.db.query<{
      status: "active" | "cancelled";
      activityStatus: string;
      enrolled: boolean;
      openingCalendar: string;
      start: string;
      end: string;
    }>(
      `SELECT x.status, a.status AS "activityStatus", f.opening_calendar AS "openingCalendar",
        x.starts_at AS start, x.ends_at AS "end",
        EXISTS (SELECT 1 FROM activity_enrolments e WHERE e.tenant_id=x.tenant_id AND e.id=$3
          AND e.activity_id=a.id AND e.status='enrolled') AS enrolled
      FROM activity_sessions x
      JOIN activities a ON a.tenant_id=x.tenant_id AND a.id=x.activity_id
      JOIN facilities f ON f.tenant_id=a.tenant_id AND f.id=a.facility_id
      WHERE x.tenant_id=$1 AND x.id=$2 FOR UPDATE OF x`,
      [tenantId, sessionId, enrolmentId],
    );
    const row = rows[0];
    return row
      ? {
          ...row,
          start: Temporal.Instant.from(row.start),
          end: Temporal.Instant.from(row.end),
        }
      : null;
  }
  async saveAttendance(
    args: Parameters<AccessRepository["saveAttendance"]>[0],
  ) {
    const { rowCount } = await this.db.query(
      `INSERT INTO activity_attendance (tenant_id,session_id,enrolment_id,status,recorded_at,actor_id)
      VALUES ($1,$2,$3,$4,$5,$6)
      ON CONFLICT (tenant_id,session_id,enrolment_id) DO UPDATE
        SET status=excluded.status, recorded_at=excluded.recorded_at, actor_id=excluded.actor_id
        WHERE excluded.recorded_at >= activity_attendance.recorded_at`,
      [
        args.tenantId,
        args.sessionId,
        args.enrolmentId,
        args.status,
        args.recordedAt.toString(),
        args.actorId,
      ],
    );
    return (rowCount ?? 0) > 0;
  }
  async findForCheckIn(tenantId: string, bookingId: string) {
    const { rows } = await this.db.query<{
      status: PassTarget["status"];
      sequence: number;
      openingCalendar: string;
      start: string;
      end: string;
    }>(
      'SELECT b.status, b.sequence, f.opening_calendar AS "openingCalendar", b.starts_at AS start, b.ends_at AS "end" FROM bookings b JOIN facilities f ON f.tenant_id=b.tenant_id AND f.id=b.facility_id WHERE b.tenant_id=$1 AND b.id=$2 FOR UPDATE OF b',
      [tenantId, bookingId],
    );
    const row = rows[0];
    return row
      ? {
          status: row.status,
          sequence: row.sequence,
          openingCalendar: row.openingCalendar,
          start: Temporal.Instant.from(row.start),
          end: Temporal.Instant.from(row.end),
        }
      : null;
  }
  async addCheckIn(args: Parameters<AccessRepository["addCheckIn"]>[0]) {
    const { rowCount } = await this.db.query(
      "INSERT INTO check_ins (id,tenant_id,booking_id,checked_in_at,recorded_at,actor_id,method,booking_sequence) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) ON CONFLICT (tenant_id,booking_id,booking_sequence) DO NOTHING",
      [
        args.id,
        args.tenantId,
        args.bookingId,
        args.checkedInAt.toString(),
        args.recordedAt.toString(),
        args.actorId,
        args.method,
        args.sequence,
      ],
    );
    return (rowCount ?? 0) > 0;
  }
  async webhook(tenantId: string) {
    const { rows } = await this.db.query<{
      url: string;
      secretSealed: string | null;
    }>(
      'SELECT access_webhook_url AS url, access_webhook_secret_sealed AS "secretSealed" FROM municipalities WHERE id=$1',
      [tenantId],
    );
    return rows[0] ?? { url: "", secretSealed: null };
  }
  async setWebhook(tenantId: string, url: string, secretSealed: string | null) {
    await this.db.query(
      "UPDATE municipalities SET access_webhook_url=$2, access_webhook_secret_sealed=$3 WHERE id=$1",
      [tenantId, url, secretSealed],
    );
  }
}
