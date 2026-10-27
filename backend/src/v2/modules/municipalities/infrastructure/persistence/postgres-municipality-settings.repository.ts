// SPDX-License-Identifier: AGPL-3.0-or-later
import { Injectable } from "@nestjs/common";
import { Temporal } from "@js-temporal/polyfill";
import {
  EditableSettings,
  MunicipalitySettingsRepository,
} from "../../domain/municipality-settings.repository";
import { Logo, LogoType } from "../../domain/logo";
import { LegalTexts } from "../../../../shared/application/municipality-settings";
import { Database } from "../../../../shared/infrastructure/database";
@Injectable()
export class PostgresMunicipalitySettingsRepository extends MunicipalitySettingsRepository {
  constructor(private readonly db: Database) {
    super();
  }
  async save(tenantId: string, value: EditableSettings) {
    await this.db.query(
      "UPDATE municipalities SET locale=$2, advance_days=$3, cancellation_hours=$4, max_active_bookings=$5, contact=$6, primary_color=$7, holidays_calendar=$8 WHERE id=$1",
      [
        tenantId,
        value.locale,
        value.advanceDays,
        value.cancellationHours,
        value.maxActiveBookings,
        value.contact,
        value.primaryColor,
        value.holidaysCalendar,
      ],
    );
  }
  async publishLegalTexts(
    tenantId: string,
    texts: LegalTexts,
    date: Temporal.PlainDate,
    publishedAt: Temporal.Instant,
  ) {
    // The row lock serialises concurrent publications so sequence numbers stay unique.
    await this.db.query(
      "SELECT id FROM municipalities WHERE id=$1 FOR UPDATE",
      [tenantId],
    );
    const prefix = `${date.toString()}.`;
    const { rows } = await this.db.query<{ count: string }>(
      "SELECT count(*) FROM legal_texts WHERE tenant_id=$1 AND starts_with(version, $2)",
      [tenantId, prefix],
    );
    const version = `${prefix}${Number(rows[0].count) + 1}`;
    await this.db.query(
      "INSERT INTO legal_texts (tenant_id,version,text_gl,text_es,published_at) VALUES ($1,$2,$3,$4,$5)",
      [tenantId, version, texts.gl, texts.es, publishedAt.toString()],
    );
    await this.db.query(
      "UPDATE municipalities SET legal_version=$2, legal_text=$3 WHERE id=$1",
      [tenantId, version, texts.gl],
    );
    return version;
  }
  async upcomingHolidayExposedStarts(tenantId: string, now: Temporal.Instant) {
    const { rows } = await this.db.query<{ start: string }>(
      "SELECT b.starts_at AS start FROM bookings b JOIN facilities f ON f.tenant_id=b.tenant_id AND f.id=b.facility_id WHERE b.tenant_id=$1 AND b.status='confirmed' AND b.starts_at>$2 AND f.follows_municipal_holidays",
      [tenantId, now.toString()],
    );
    return rows.map((row) => Temporal.Instant.from(row.start));
  }
  async saveLogo(tenantId: string, logo: Logo, updatedAt: Temporal.Instant) {
    await this.db.query(
      "INSERT INTO municipality_logos (tenant_id,content_type,data,sha256,updated_at) VALUES ($1,$2,$3,encode(sha256($3),'hex'),$4) ON CONFLICT (tenant_id) DO UPDATE SET content_type=$2, data=$3, sha256=encode(sha256($3),'hex'), updated_at=$4",
      [
        tenantId,
        logo.contentType,
        Buffer.from(logo.data),
        updatedAt.toString(),
      ],
    );
  }
  async deleteLogo(tenantId: string) {
    return Boolean(
      (
        await this.db.query(
          "DELETE FROM municipality_logos WHERE tenant_id=$1",
          [tenantId],
        )
      ).rowCount,
    );
  }
  async findLogo(slug: string) {
    const { rows } = await this.db.query<{
      contentType: LogoType;
      data: Buffer;
      version: string;
    }>(
      'SELECT l.content_type AS "contentType", l.data, left(l.sha256, 16) AS version FROM municipality_logos l JOIN municipalities m ON m.id=l.tenant_id WHERE m.slug=$1',
      [slug],
    );
    return rows[0] ?? null;
  }
}
