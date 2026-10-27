// SPDX-License-Identifier: AGPL-3.0-or-later
import { Injectable } from "@nestjs/common";
import { Database } from "../../../../shared/infrastructure/database";
import {
  FacilityPriceList,
  FacilityPrices,
} from "../../domain/facility-prices";
@Injectable()
export class PostgresFacilityPrices extends FacilityPrices {
  constructor(private readonly db: Database) {
    super();
  }
  async find(tenantId: string, facilityId: string) {
    const { rows } = await this.db.query<FacilityPriceList>(
      `SELECT f.price_cents AS "priceCents", COALESCE((SELECT json_agg(json_build_object('category', p.category, 'priceCents', p.price_cents)) FROM facility_prices p WHERE p.tenant_id=f.tenant_id AND p.facility_id=f.id), '[]') AS prices FROM facilities f WHERE f.tenant_id=$1 AND f.id=$2`,
      [tenantId, facilityId],
    );
    return rows[0] ?? null;
  }
}
