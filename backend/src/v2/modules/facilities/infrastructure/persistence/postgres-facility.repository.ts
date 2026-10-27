// SPDX-License-Identifier: AGPL-3.0-or-later
import { Injectable } from "@nestjs/common";
import { Temporal } from "@js-temporal/polyfill";
import { Facility } from "../../domain/facility.entity";
import { FacilityRepository } from "../../domain/facility.repository";
import { Database } from "../../../../shared/infrastructure/database";
import { Result } from "../../../../shared/application/result";
import { failure } from "../../../../shared/application/errors";
const fields =
  'id, tenant_id AS "tenantId", name, sport, address, description, accessible, status, slot_minutes AS "slotMinutes", price_cents AS "priceCents", opening_calendar AS "openingCalendar", rules';
@Injectable()
export class PostgresFacilityRepository extends FacilityRepository {
  constructor(private readonly db: Database) {
    super();
  }
  async list(tenantId: string) {
    return (
      await this.db.query<Facility>(
        `SELECT ${fields} FROM facilities WHERE tenant_id=$1 ORDER BY name`,
        [tenantId],
      )
    ).rows;
  }
  async find(tenantId: string, id: string, lock = false) {
    return (
      (
        await this.db.query<Facility>(
          `SELECT ${fields} FROM facilities WHERE tenant_id=$1 AND id=$2${lock ? " FOR UPDATE" : ""}`,
          [tenantId, id],
        )
      ).rows[0] ?? null
    );
  }
  async save(value: Facility) {
    const result = await this.db.query(
      `INSERT INTO facilities (id,tenant_id,name,sport,address,description,accessible,status,slot_minutes,price_cents,opening_calendar,rules) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) ON CONFLICT(id) DO UPDATE SET name=$3,sport=$4,address=$5,description=$6,accessible=$7,status=$8,slot_minutes=$9,price_cents=$10,opening_calendar=$11,rules=$12 WHERE facilities.tenant_id=$2 RETURNING id`,
      [
        value.id,
        value.tenantId,
        value.name,
        value.sport,
        value.address,
        value.description,
        value.accessible,
        value.status,
        value.slotMinutes,
        value.priceCents,
        value.openingCalendar,
        value.rules,
      ],
    );
    return result.rowCount ? Result.ok() : Result.err(failure("id_reused"));
  }
  async hasFutureBookings(tenantId: string, id: string, now: Temporal.Instant) {
    return (
      (
        await this.db.query(
          "SELECT id FROM bookings WHERE tenant_id=$1 AND facility_id=$2 AND status='confirmed' AND ends_at>$3 LIMIT 1",
          [tenantId, id, now.toString()],
        )
      ).rows.length > 0
    );
  }
  async busy(
    tenantId: string,
    id: string,
    start: Temporal.Instant,
    end: Temporal.Instant,
  ) {
    const { rows } = await this.db.query<{
      unitId: string;
      start: string;
      end: string;
    }>(
      'SELECT u.unit_id AS "unitId",u.starts_at AS start,u.ends_at AS end FROM booking_units u JOIN resources r ON r.tenant_id=u.tenant_id AND r.id=u.unit_id WHERE r.tenant_id=$1 AND r.facility_id=$2 AND u.starts_at<$4 AND u.ends_at>$3',
      [tenantId, id, start.toString(), end.toString()],
    );
    return rows.map((row) => ({
      unitId: row.unitId,
      start: Temporal.Instant.from(row.start),
      end: Temporal.Instant.from(row.end),
    }));
  }
}
