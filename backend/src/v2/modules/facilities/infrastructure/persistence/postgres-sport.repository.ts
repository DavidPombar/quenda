// SPDX-License-Identifier: AGPL-3.0-or-later
import { Injectable } from "@nestjs/common";
import { Sport } from "../../domain/sport.entity";
import { SportPlan } from "../../domain/sport-plan";
import { SportRepository } from "../../domain/sport.repository";
import { Database } from "../../../../shared/infrastructure/database";
import { Result } from "../../../../shared/application/result";
import { failure } from "../../../../shared/application/errors";
const fields =
  'code, name_gl AS "nameGl", name_es AS "nameEs", cnid_class AS "cnidClass", cnid_type AS "cnidType", schema_type AS "schemaType", art, visible, position';
@Injectable()
export class PostgresSportRepository extends SportRepository {
  constructor(private readonly db: Database) {
    super();
  }
  async lock(tenantId: string) {
    return (
      (
        await this.db.query(
          "SELECT id FROM municipalities WHERE id=$1 FOR UPDATE",
          [tenantId],
        )
      ).rows.length > 0
    );
  }
  async list(tenantId: string, includeHidden: boolean) {
    return (
      await this.db.query<Sport>(
        `SELECT ${fields} FROM sports WHERE tenant_id=$1 AND ($2 OR visible) ORDER BY position, code`,
        [tenantId, includeHidden],
      )
    ).rows;
  }
  async listShared(slugs: readonly string[]) {
    // One row per code: the lowest position across municipalities decides order and names.
    return (
      await this.db.query<Sport>(
        `SELECT ${fields} FROM (
          SELECT DISTINCT ON (s.code) s.* FROM sports s JOIN municipalities m ON m.id=s.tenant_id
          WHERE s.visible AND (cardinality($1::text[])=0 OR m.slug=ANY($1))
            AND EXISTS (SELECT 1 FROM facilities f WHERE f.tenant_id=s.tenant_id AND f.sport=s.code)
          ORDER BY s.code, s.position, m.name
        ) shared ORDER BY position, code`,
        [slugs],
      )
    ).rows;
  }
  async find(tenantId: string, code: string) {
    return (
      (
        await this.db.query<Sport>(
          `SELECT ${fields} FROM sports WHERE tenant_id=$1 AND code=$2`,
          [tenantId, code],
        )
      ).rows[0] ?? null
    );
  }
  async usedCodes(tenantId: string) {
    return (
      await this.db.query<{ sport: string }>(
        "SELECT sport FROM facilities WHERE tenant_id=$1 UNION SELECT sport FROM organizations WHERE tenant_id=$1 AND sport IS NOT NULL",
        [tenantId],
      )
    ).rows.map((row) => row.sport);
  }
  async apply(tenantId: string, plan: SportPlan) {
    for (const sport of plan.save)
      await this.db.query(
        `INSERT INTO sports (tenant_id,code,name_gl,name_es,cnid_class,cnid_type,schema_type,art,visible,position)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
        ON CONFLICT (tenant_id,code) DO UPDATE SET name_gl=$3,name_es=$4,cnid_class=$5,cnid_type=$6,schema_type=$7,art=$8,visible=$9,position=$10`,
        [
          tenantId,
          sport.code,
          sport.nameGl,
          sport.nameEs,
          sport.cnidClass,
          sport.cnidType,
          sport.schemaType,
          sport.art,
          sport.visible,
          sport.position,
        ],
      );
    if (plan.remove.length)
      try {
        await this.db.query(
          "DELETE FROM sports WHERE tenant_id=$1 AND code=ANY($2::text[])",
          [tenantId, plan.remove],
        );
      } catch (error) {
        if ((error as { code?: string }).code === "23503")
          return Result.err(failure("sport_in_use"));
        throw error;
      }
    return Result.ok();
  }
}
