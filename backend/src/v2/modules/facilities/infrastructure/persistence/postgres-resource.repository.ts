// SPDX-License-Identifier: AGPL-3.0-or-later
import { Injectable } from "@nestjs/common";
import { Temporal } from "@js-temporal/polyfill";
import { Resource } from "../../domain/resource.entity";
import { ResourcePlan, ResourceUsage } from "../../domain/resource-plan";
import { ResourceRepository } from "../../domain/resource.repository";
import { Database } from "../../../../shared/infrastructure/database";
const fields =
  'id, tenant_id AS "tenantId", facility_id AS "facilityId", name, position, parent_id AS "parentId", active';
@Injectable()
export class PostgresResourceRepository extends ResourceRepository {
  constructor(private readonly db: Database) {
    super();
  }
  async listByTenant(tenantId: string) {
    return (
      await this.db.query<Resource>(
        `SELECT ${fields} FROM resources WHERE tenant_id=$1 ORDER BY facility_id, position, name`,
        [tenantId],
      )
    ).rows;
  }
  async listByFacility(tenantId: string, facilityId: string) {
    return (
      await this.db.query<Resource>(
        `SELECT ${fields} FROM resources WHERE tenant_id=$1 AND facility_id=$2 ORDER BY position, name`,
        [tenantId, facilityId],
      )
    ).rows;
  }
  async add(value: Resource) {
    await this.db.query(
      "INSERT INTO resources (id,tenant_id,facility_id,name,position,parent_id,active) VALUES ($1,$2,$3,$4,$5,$6,$7) ON CONFLICT(id) DO NOTHING",
      [
        value.id,
        value.tenantId,
        value.facilityId,
        value.name,
        value.position,
        value.parentId,
        value.active,
      ],
    );
  }
  async foreignIds(
    tenantId: string,
    facilityId: string,
    ids: readonly string[],
  ) {
    return (
      await this.db.query<{ id: string }>(
        "SELECT id FROM resources WHERE id=ANY($3::uuid[]) AND NOT (tenant_id=$1 AND facility_id=$2)",
        [tenantId, facilityId, ids],
      )
    ).rows.map((row) => row.id);
  }
  async usage(tenantId: string, facilityId: string, now: Temporal.Instant) {
    return (
      await this.db.query<ResourceUsage>(
        `SELECT r.id AS "resourceId",
          EXISTS (SELECT 1 FROM bookings b WHERE b.tenant_id=r.tenant_id AND b.resource_id=r.id AND b.status='confirmed' AND b.ends_at>$3)
            OR EXISTS (SELECT 1 FROM booking_units u JOIN bookings b ON b.tenant_id=u.tenant_id AND b.id=u.booking_id
              WHERE u.tenant_id=r.tenant_id AND u.unit_id=r.id AND b.status='confirmed' AND u.ends_at>$3) AS upcoming,
          EXISTS (SELECT 1 FROM bookings b WHERE b.tenant_id=r.tenant_id AND b.resource_id=r.id)
            OR EXISTS (SELECT 1 FROM booking_units u WHERE u.tenant_id=r.tenant_id AND u.unit_id=r.id) AS referenced
        FROM resources r WHERE r.tenant_id=$1 AND r.facility_id=$2`,
        [tenantId, facilityId, now.toString()],
      )
    ).rows;
  }
  async apply(tenantId: string, facilityId: string, plan: ResourcePlan) {
    for (const item of plan.save)
      await this.db.query(
        `INSERT INTO resources (id,tenant_id,facility_id,name,position,parent_id,active) VALUES ($1,$2,$3,$4,$5,$6,$7)
        ON CONFLICT(id) DO UPDATE SET name=$4, position=$5, parent_id=$6, active=$7
        WHERE resources.tenant_id=$2 AND resources.facility_id=$3`,
        [
          item.id,
          tenantId,
          facilityId,
          item.name,
          item.position,
          item.parentId,
          item.active,
        ],
      );
    if (plan.remove.length)
      await this.db.query(
        "DELETE FROM resources WHERE tenant_id=$1 AND facility_id=$2 AND id=ANY($3::uuid[]) AND parent_id IS NOT NULL",
        [tenantId, facilityId, plan.remove],
      );
    if (plan.remove.length)
      await this.db.query(
        "DELETE FROM resources WHERE tenant_id=$1 AND facility_id=$2 AND id=ANY($3::uuid[])",
        [tenantId, facilityId, plan.remove],
      );
  }
}
