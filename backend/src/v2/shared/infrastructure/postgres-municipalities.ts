// SPDX-License-Identifier: AGPL-3.0-or-later
import { Injectable } from "@nestjs/common";
import {
  Municipalities,
  MunicipalitySettings,
} from "../application/municipality-settings";
import { Database } from "./database";
// Municipalities created before versioned notices fall back to their single legal_text.
const projection =
  'm.id, m.slug, m.name, m.timezone, m.locale, m.advance_days AS "advanceDays", m.cancellation_hours AS "cancellationHours", m.max_active_bookings AS "maxActiveBookings", m.contact, ' +
  "json_build_object('gl', COALESCE(t.text_gl, m.legal_text), 'es', COALESCE(t.text_es, m.legal_text)) AS \"legalTexts\", " +
  'm.legal_version AS "legalVersion", m.retention_months AS "retentionMonths", m.primary_color AS "primaryColor", m.holidays_calendar AS "holidaysCalendar", left(l.sha256, 16) AS "logoVersion", ' +
  'm.no_show_limit AS "noShowLimit", m.no_show_window_days AS "noShowWindowDays", m.no_show_block_days AS "noShowBlockDays"';
const source =
  "municipalities m LEFT JOIN legal_texts t ON t.tenant_id=m.id AND t.version=m.legal_version LEFT JOIN municipality_logos l ON l.tenant_id=m.id";
@Injectable()
export class PostgresMunicipalities extends Municipalities {
  constructor(private readonly db: Database) {
    super();
  }
  async list() {
    return (
      await this.db.query<MunicipalitySettings>(
        `SELECT ${projection} FROM ${source} ORDER BY m.name`,
      )
    ).rows;
  }
  async find(id: string) {
    return (
      (
        await this.db.query<MunicipalitySettings>(
          `SELECT ${projection} FROM ${source} WHERE m.id=$1`,
          [id],
        )
      ).rows[0] ?? null
    );
  }
  async findBySlug(slug: string) {
    return (
      (
        await this.db.query<MunicipalitySettings>(
          `SELECT ${projection} FROM ${source} WHERE m.slug=$1`,
          [slug],
        )
      ).rows[0] ?? null
    );
  }
}
