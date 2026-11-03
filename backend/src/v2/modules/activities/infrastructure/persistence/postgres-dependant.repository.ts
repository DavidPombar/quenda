// SPDX-License-Identifier: AGPL-3.0-or-later
import { Injectable } from "@nestjs/common";
import { Temporal } from "@js-temporal/polyfill";
import { Database } from "../../../../shared/infrastructure/database";
import { DependantRepository } from "../../domain/dependant.repository";
import type { Dependant } from "../../domain/dependant.entity";
interface Row {
  id: string;
  tenantId: string;
  userId: string;
  firstName: string;
  birthYear: number;
  declarationVersion: string;
  declaredAt: string;
  createdAt: string;
}
const columns = `id, tenant_id AS "tenantId", user_id AS "userId", first_name AS "firstName",
  birth_year AS "birthYear", declaration_version AS "declarationVersion",
  declared_at AS "declaredAt", created_at AS "createdAt"`;
function dependant(row: Row): Dependant {
  return {
    ...row,
    declaredAt: Temporal.Instant.from(row.declaredAt),
    createdAt: Temporal.Instant.from(row.createdAt),
  };
}
@Injectable()
export class PostgresDependantRepository extends DependantRepository {
  constructor(private readonly db: Database) {
    super();
  }
  async lockUser(tenantId: string, userId: string) {
    await this.db.query(
      "SELECT 1 FROM users WHERE tenant_id=$1 AND id=$2 FOR UPDATE",
      [tenantId, userId],
    );
  }
  async findById(tenantId: string, id: string) {
    const { rows } = await this.db.query<Row>(
      `SELECT ${columns} FROM dependants WHERE tenant_id=$1 AND id=$2`,
      [tenantId, id],
    );
    return rows[0] ? dependant(rows[0]) : null;
  }
  async list(tenantId: string, userId: string) {
    const { rows } = await this.db.query<Row>(
      `SELECT ${columns} FROM dependants WHERE tenant_id=$1 AND user_id=$2 ORDER BY created_at, id`,
      [tenantId, userId],
    );
    return rows.map(dependant);
  }
  async find(tenantId: string, userId: string, id: string) {
    const { rows } = await this.db.query<Row>(
      `SELECT ${columns} FROM dependants WHERE tenant_id=$1 AND user_id=$2 AND id=$3`,
      [tenantId, userId, id],
    );
    return rows[0] ? dependant(rows[0]) : null;
  }
  async add(value: Dependant) {
    await this.db.query(
      `INSERT INTO dependants (id,tenant_id,user_id,first_name,birth_year,declaration_version,declared_at,created_at)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
      [
        value.id,
        value.tenantId,
        value.userId,
        value.firstName,
        value.birthYear,
        value.declarationVersion,
        value.declaredAt.toString(),
        value.createdAt.toString(),
      ],
    );
  }
  async save(value: Dependant) {
    await this.db.query(
      `UPDATE dependants SET first_name=$3, birth_year=$4, declaration_version=$5, declared_at=$6
      WHERE tenant_id=$1 AND id=$2`,
      [
        value.tenantId,
        value.id,
        value.firstName,
        value.birthYear,
        value.declarationVersion,
        value.declaredAt.toString(),
      ],
    );
  }
  async remove(tenantId: string, id: string) {
    await this.db.query("DELETE FROM dependants WHERE tenant_id=$1 AND id=$2", [
      tenantId,
      id,
    ]);
  }
  async removeAll(tenantId: string, userId: string) {
    const { rowCount } = await this.db.query(
      "DELETE FROM dependants WHERE tenant_id=$1 AND user_id=$2",
      [tenantId, userId],
    );
    return rowCount ?? 0;
  }
  async hasOpenEnrolments(tenantId: string, id: string) {
    const { rowCount } = await this.db.query(
      "SELECT 1 FROM activity_enrolments WHERE tenant_id=$1 AND dependant_id=$2 AND status IN ('enrolled','waiting') LIMIT 1",
      [tenantId, id],
    );
    return (rowCount ?? 0) > 0;
  }
}
