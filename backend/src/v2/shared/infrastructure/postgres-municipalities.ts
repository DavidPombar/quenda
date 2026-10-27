// SPDX-License-Identifier: AGPL-3.0-or-later
import { Injectable } from "@nestjs/common";
import {
  Municipalities,
  MunicipalitySettings,
} from "../application/municipality-settings";
import { Database } from "./database";
const projection =
  'id, slug, name, timezone, locale, advance_days AS "advanceDays", cancellation_hours AS "cancellationHours", max_active_bookings AS "maxActiveBookings", contact, legal_text AS "legalText", legal_version AS "legalVersion", retention_months AS "retentionMonths", ' +
  "json_build_object('unit', accessibility_unit, 'email', accessibility_email, 'phone', accessibility_phone, 'reviewedOn', to_char(accessibility_reviewed_on, 'YYYY-MM-DD'), 'method', accessibility_method, 'exceptions', json_build_object('gl', accessibility_exceptions_gl, 'es', accessibility_exceptions_es)) AS accessibility";
@Injectable()
export class PostgresMunicipalities extends Municipalities {
  constructor(private readonly db: Database) {
    super();
  }
  async list() {
    return (
      await this.db.query<MunicipalitySettings>(
        `SELECT ${projection} FROM municipalities ORDER BY name`,
      )
    ).rows;
  }
  async find(id: string) {
    return (
      (
        await this.db.query<MunicipalitySettings>(
          `SELECT ${projection} FROM municipalities WHERE id=$1`,
          [id],
        )
      ).rows[0] ?? null
    );
  }
  async findBySlug(slug: string) {
    return (
      (
        await this.db.query<MunicipalitySettings>(
          `SELECT ${projection} FROM municipalities WHERE slug=$1`,
          [slug],
        )
      ).rows[0] ?? null
    );
  }
}
