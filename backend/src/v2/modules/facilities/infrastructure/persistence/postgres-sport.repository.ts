// SPDX-License-Identifier: AGPL-3.0-or-later
import { Injectable } from "@nestjs/common";
import { Sport } from "../../domain/sport.entity";
import { SportRepository } from "../../domain/sport.repository";
import { Database } from "../../../../shared/infrastructure/database";
const fields = `s.code, json_build_object('gl', s.name_gl, 'es', s.name_es) AS name, s.cnid_class AS "cnidClass",
  s.cnid_type AS "cnidType", s.schema_type AS "schemaType", s.art, s.hidden, s.position`;
@Injectable()
export class PostgresSportRepository extends SportRepository {
  constructor(private readonly db: Database) {
    super();
  }
  async list(tenantId: string) {
    return (
      await this.db.query<Sport>(
        `SELECT ${fields} FROM sports s WHERE s.tenant_id=$1 ORDER BY s.position, s.code`,
        [tenantId],
      )
    ).rows;
  }
  async visible(slugs: readonly string[]) {
    return (
      await this.db.query<Sport>(
        `SELECT DISTINCT ON (s.code) ${fields} FROM sports s JOIN municipalities m ON m.id=s.tenant_id
        WHERE NOT s.hidden AND (cardinality($1::text[])=0 OR m.slug=ANY($1))
          AND EXISTS (SELECT 1 FROM facilities f WHERE f.tenant_id=s.tenant_id AND f.sport=s.code)
        ORDER BY s.code, m.name`,
        [slugs],
      )
    ).rows.sort(
      (a, b) => a.position - b.position || a.code.localeCompare(b.code),
    );
  }
  async find(tenantId: string, code: string) {
    return (
      (
        await this.db.query<Sport>(
          `SELECT ${fields} FROM sports s WHERE s.tenant_id=$1 AND s.code=$2`,
          [tenantId, code],
        )
      ).rows[0] ?? null
    );
  }
  async save(tenantId: string, sport: Sport) {
    await this.db.query(
      `INSERT INTO sports (tenant_id,code,name_gl,name_es,cnid_class,cnid_type,schema_type,hidden,position,art)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) ON CONFLICT (tenant_id,code) DO UPDATE SET name_gl=$3,name_es=$4,
      cnid_class=$5,cnid_type=$6,schema_type=$7,hidden=$8,position=$9,art=$10`,
      [
        tenantId,
        sport.code,
        sport.name.gl,
        sport.name.es,
        sport.cnidClass,
        sport.cnidType,
        sport.schemaType,
        sport.hidden,
        sport.position,
        sport.art,
      ],
    );
  }
  async inUse(tenantId: string, code: string) {
    return Boolean(
      (
        await this.db.query(
          `SELECT 1 FROM facilities WHERE tenant_id=$1 AND sport=$2
          UNION ALL SELECT 1 FROM organizations WHERE tenant_id=$1 AND sport=$2 LIMIT 1`,
          [tenantId, code],
        )
      ).rowCount,
    );
  }
  async remove(tenantId: string, code: string) {
    return Boolean(
      (
        await this.db.query(
          "DELETE FROM sports WHERE tenant_id=$1 AND code=$2",
          [tenantId, code],
        )
      ).rowCount,
    );
  }
}
