// SPDX-License-Identifier: AGPL-3.0-or-later
import { Injectable } from "@nestjs/common";
import { Temporal } from "@js-temporal/polyfill";
import { UserCategoryRepository } from "../../domain/user-category.repository";
import {
  CategoryRequest,
  CitizenCategories,
  UserCategory,
} from "../../domain/user-category.entity";
import { Category } from "../../../../shared/application/categories";
import { Database } from "../../../../shared/infrastructure/database";
interface CategoryRow {
  category: Category;
  status: UserCategory["status"];
  requestedAt: string | null;
  decidedAt: string | null;
}
interface CitizenRow {
  userId: string;
  displayName: string;
  categories: CategoryRow[];
}
const instant = (value: string | null) =>
  value === null ? null : Temporal.Instant.from(value);
function toCitizen(row: CitizenRow): CitizenCategories {
  return {
    userId: row.userId,
    displayName: row.displayName,
    categories: row.categories.map((entry) => ({
      category: entry.category,
      status: entry.status,
      requestedAt: instant(entry.requestedAt),
      decidedAt: instant(entry.decidedAt),
    })),
  };
}
// Timestamps go through to_json so they parse as ISO 8601 instants.
const citizens = `SELECT u.id AS "userId", u.display_name AS "displayName",
  COALESCE((SELECT json_agg(json_build_object('category', c.category, 'status', c.status,
      'requestedAt', c.requested_at, 'decidedAt', c.decided_at)
    ORDER BY array_position(ARRAY['resident','family','local_club','minor','large_family','disability','senior'], c.category))
    FROM user_categories c WHERE c.tenant_id=u.tenant_id AND c.user_id=u.id), '[]') AS categories
  FROM users u WHERE u.tenant_id=$1 AND u.role='citizen' AND u.deleted_at IS NULL`;
@Injectable()
export class PostgresUserCategoryRepository extends UserCategoryRepository {
  constructor(private readonly db: Database) {
    super();
  }
  async lockUser(tenantId: string, userId: string) {
    await this.db.query(
      "SELECT id FROM users WHERE tenant_id=$1 AND id=$2 FOR UPDATE",
      [tenantId, userId],
    );
  }
  async findCitizen(tenantId: string, userId: string) {
    const { rows } = await this.db.query<CitizenRow>(
      `${citizens} AND u.id=$2`,
      [tenantId, userId],
    );
    return rows[0] ? toCitizen(rows[0]) : null;
  }
  async save(tenantId: string, userId: string, value: UserCategory) {
    await this.db.query(
      "INSERT INTO user_categories (tenant_id,user_id,category,status,requested_at,decided_at) VALUES ($1,$2,$3,$4,$5,$6) ON CONFLICT (tenant_id,user_id,category) DO UPDATE SET status=$4, requested_at=$5, decided_at=$6",
      [
        tenantId,
        userId,
        value.category,
        value.status,
        value.requestedAt?.toString() ?? null,
        value.decidedAt?.toString() ?? null,
      ],
    );
  }
  async remove(tenantId: string, userId: string, category: Category) {
    const { rowCount } = await this.db.query(
      "DELETE FROM user_categories WHERE tenant_id=$1 AND user_id=$2 AND category=$3",
      [tenantId, userId, category],
    );
    return Boolean(rowCount);
  }
  async prefersFamily(tenantId: string, userId: string) {
    const { rows } = await this.db.query<{ value: boolean }>(
      "SELECT prefers_family_tariff AS value FROM users WHERE tenant_id=$1 AND id=$2",
      [tenantId, userId],
    );
    return rows[0]?.value ?? false;
  }
  async setPrefersFamily(tenantId: string, userId: string, value: boolean) {
    await this.db.query(
      "UPDATE users SET prefers_family_tariff=$3 WHERE tenant_id=$1 AND id=$2",
      [tenantId, userId, value],
    );
  }
  async listPending(tenantId: string) {
    const { rows } = await this.db.query<{
      userId: string;
      displayName: string;
      category: Category;
      requestedAt: string;
    }>(
      `SELECT c.user_id AS "userId", u.display_name AS "displayName", c.category, c.requested_at AS "requestedAt"
      FROM user_categories c JOIN users u ON u.tenant_id=c.tenant_id AND u.id=c.user_id
      WHERE c.tenant_id=$1 AND c.status='requested' AND u.deleted_at IS NULL
      ORDER BY c.requested_at, u.display_name LIMIT 200`,
      [tenantId],
    );
    return rows.map((row): CategoryRequest => ({
      ...row,
      requestedAt: Temporal.Instant.from(row.requestedAt),
    }));
  }
  async searchCitizens(tenantId: string, query: string, limit: number) {
    const pattern = `%${query.replace(/[\\%_]/g, (match) => `\\${match}`)}%`;
    const { rows } = await this.db.query<CitizenRow>(
      `${citizens} AND u.display_name ILIKE $2 ORDER BY u.display_name LIMIT $3`,
      [tenantId, pattern, limit],
    );
    return rows.map(toCitizen);
  }
}
