// SPDX-License-Identifier: AGPL-3.0-or-later
import { Injectable } from "@nestjs/common";
import { Resource } from "../../domain/resource.entity";
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
}
