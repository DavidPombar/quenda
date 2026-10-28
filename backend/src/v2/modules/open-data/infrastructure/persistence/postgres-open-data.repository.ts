// SPDX-License-Identifier: AGPL-3.0-or-later
import { Injectable } from "@nestjs/common";
import { OpenDataRepository } from "../../domain/open-data.repository";
import { OpenFacility } from "../../domain/open-facility.read-model";
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
            WHERE r.tenant_id=f.tenant_id AND r.facility_id=f.id AND r.active AND r.parent_id IS NULL) AS courts
        FROM facilities f WHERE f.tenant_id=$1 ORDER BY f.name, f.id`,
        [tenantId],
      )
    ).rows;
  }
}
