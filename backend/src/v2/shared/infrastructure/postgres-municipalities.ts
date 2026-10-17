// SPDX-License-Identifier: AGPL-3.0-or-later
import { Injectable } from "@nestjs/common";
import {
  Municipalities,
  MunicipalitySettings,
} from "../application/municipality-settings";
import { Database } from "./database";
const projection =
  'id, slug, name, timezone, locale, advance_days AS "advanceDays", cancellation_hours AS "cancellationHours", max_active_bookings AS "maxActiveBookings", contact, legal_text AS "legalText"';
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
