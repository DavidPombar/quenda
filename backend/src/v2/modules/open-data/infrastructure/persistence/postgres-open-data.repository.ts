// SPDX-License-Identifier: AGPL-3.0-or-later
import { Injectable } from "@nestjs/common";
import { OpenDataRepository } from "../../domain/open-data.repository";
import { OpenFacility } from "../../domain/open-facility.read-model";
import { OpenActivity } from "../../domain/open-activity.read-model";
import { Database } from "../../../../shared/infrastructure/database";
@Injectable()
export class PostgresOpenDataRepository extends OpenDataRepository {
  constructor(private readonly db: Database) {
    super();
  }
  async facilities(tenantId: string) {
    return (
      await this.db.query<OpenFacility>(
        `SELECT f.id, f.name, f.sport, f.address, f.description, f.accessible, f.status,
          f.slot_minutes AS "slotMinutes", f.price_cents AS "priceCents", f.latitude, f.longitude,
          (SELECT count(*)::int FROM resources r
            WHERE r.tenant_id=f.tenant_id AND r.facility_id=f.id AND r.active AND r.parent_id IS NULL) AS courts,
          json_build_object('cnidClass', s.cnid_class, 'cnidType', s.cnid_type, 'schemaType', s.schema_type) AS classification
        FROM facilities f JOIN sports s ON s.tenant_id=f.tenant_id AND s.code=f.sport
        WHERE f.tenant_id=$1 ORDER BY f.name, f.id`,
        [tenantId],
      )
    ).rows;
  }
  async activities(tenantId: string, today: string) {
    const { rows } = await this.db.query<
      Omit<OpenActivity, "rule" | "rrule"> & {
        weekdays: number[];
        startsLocal: string;
        endsLocal: string;
        startsOn: string;
        endsOn: string;
        exceptions: string[];
        schedule: string;
      }
    >(
      `SELECT a.id, a.name_gl AS name, a.sport, a.facility_id AS "facilityId", f.name AS "facilityName",
        f.address AS "facilityAddress", r.name AS "resourceName", a.weekdays,
        to_char(a.starts_local, 'HH24:MI') AS "startsLocal", to_char(a.ends_local, 'HH24:MI') AS "endsLocal",
        to_char(a.starts_on, 'YYYY-MM-DD') AS "startsOn", to_char(a.ends_on, 'YYYY-MM-DD') AS "endsOn",
        ARRAY(SELECT to_char(e, 'YYYY-MM-DD') FROM unnest(a.exceptions) AS e ORDER BY e) AS exceptions,
        a.schedule, a.places, a.min_age AS "minAge", a.max_age AS "maxAge",
        to_char(a.enrolment_opens_on, 'YYYY-MM-DD') AS "enrolmentOpensOn",
        to_char(a.enrolment_closes_on, 'YYYY-MM-DD') AS "enrolmentClosesOn",
        (SELECT p.price_cents FROM activity_prices p WHERE p.tenant_id=a.tenant_id AND p.activity_id=a.id AND p.category='general') AS "priceCents"
      FROM activities a
        JOIN facilities f ON f.tenant_id=a.tenant_id AND f.id=a.facility_id
        JOIN resources r ON r.tenant_id=a.tenant_id AND r.id=a.resource_id
      WHERE a.tenant_id=$1 AND a.status='published' AND a.ends_on>=$2::date
      ORDER BY a.starts_on, a.name_gl, a.id`,
      [tenantId, today],
    );
    return rows.map(
      ({
        weekdays,
        startsLocal,
        endsLocal,
        startsOn,
        endsOn,
        exceptions,
        schedule,
        ...value
      }) => ({
        ...value,
        rule: {
          weekdays: weekdays.map(Number),
          startsLocal,
          endsLocal,
          startsOn,
          endsOn,
          exceptions,
        },
        rrule: /^RRULE:(.*)$/m.exec(schedule)?.[1]?.trim() ?? "",
      }),
    );
  }
}
