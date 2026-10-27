// SPDX-License-Identifier: AGPL-3.0-or-later
import { Injectable } from "@nestjs/common";
import {
  DeploymentRepository,
  FacilityCount,
  NewMunicipality,
  StaffMember,
} from "../../domain/deployment.repository";
import { Database } from "../../../../shared/infrastructure/database";
const staff =
  'id, tenant_id AS "tenantId", display_name AS "displayName", email';
@Injectable()
export class PostgresDeploymentRepository extends DeploymentRepository {
  constructor(private readonly db: Database) {
    super();
  }
  async slugTaken(slug: string) {
    return (
      (
        await this.db.query("SELECT 1 FROM municipalities WHERE slug=$1", [
          slug,
        ])
      ).rows.length > 0
    );
  }
  async createMunicipality(value: NewMunicipality) {
    await this.db.query(
      "INSERT INTO municipalities (id,slug,name,timezone,locale,advance_days,cancellation_hours,max_active_bookings,contact,legal_text,legal_version) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)",
      [
        value.id,
        value.slug,
        value.name,
        value.timezone,
        value.locale,
        value.advanceDays,
        value.cancellationHours,
        value.maxActiveBookings,
        value.contact,
        value.legalTexts.gl,
        value.legalVersion,
      ],
    );
    await this.db.query(
      "INSERT INTO legal_texts (tenant_id,version,text_gl,text_es,published_at) VALUES ($1,$2,$3,$4,$5)",
      [
        value.id,
        value.legalVersion,
        value.legalTexts.gl,
        value.legalTexts.es,
        value.publishedAt.toString(),
      ],
    );
  }
  async managers() {
    return (
      await this.db.query<StaffMember>(
        `SELECT ${staff} FROM users WHERE role='manager' AND deleted_at IS NULL ORDER BY display_name`,
      )
    ).rows;
  }
  async facilityCounts() {
    return (
      await this.db.query<FacilityCount>(
        `SELECT tenant_id AS "tenantId", count(*)::int AS total, count(*) FILTER (WHERE status='active')::int AS active FROM facilities GROUP BY tenant_id`,
      )
    ).rows;
  }
  async findUser(id: string) {
    return (
      (
        await this.db.query<StaffMember & { role: string }>(
          `SELECT ${staff}, role FROM users WHERE id=$1`,
          [id],
        )
      ).rows[0] ?? null
    );
  }
  async createManager(value: StaffMember) {
    await this.db.query(
      "INSERT INTO users (id,tenant_id,display_name,role,email) VALUES ($1,$2,$3,'manager',$4)",
      [value.id, value.tenantId, value.displayName, value.email],
    );
  }
}
