// SPDX-License-Identifier: AGPL-3.0-or-later
import { Injectable } from "@nestjs/common";
import { Temporal } from "@js-temporal/polyfill";
import { Facility } from "../../domain/facility.entity";
import {
  CatalogEntry,
  CatalogFilters,
  FacilityFilters,
  FacilityRepository,
  PageRequest,
} from "../../domain/facility.repository";
import { Database } from "../../../../shared/infrastructure/database";
import { Result } from "../../../../shared/application/result";
import { failure } from "../../../../shared/application/errors";
const fields =
  'id, tenant_id AS "tenantId", name, sport, address, description, accessible, status, slot_minutes AS "slotMinutes", price_cents AS "priceCents", opening_calendar AS "openingCalendar", rules, latitude, longitude, follows_municipal_holidays AS "followsMunicipalHolidays", ' +
  `COALESCE((SELECT json_agg(json_build_object('category', p.category, 'priceCents', p.price_cents) ORDER BY array_position(ARRAY['resident','family','local_club','minor','large_family','disability','senior'], p.category)) FROM facility_prices p WHERE p.tenant_id=facilities.tenant_id AND p.facility_id=facilities.id), '[]') AS prices`;
/** Shared filter on $1 (text), $2 (sport), $3 (step-free) and $5 (hide closed). */
const filtered = (alias: string) =>
  `($1::text IS NULL OR ${alias}.name ILIKE $1 OR ${alias}.address ILIKE $1)
  AND ($2::text IS NULL OR ${alias}.sport=$2)
  AND ($3::boolean IS NULL OR ${alias}.accessible=$3)
  AND (NOT coalesce($5::boolean, false) OR ${alias}.status<>'closed')`;
const filterValues = (filters: FacilityFilters) => [
  filters.q ? `%${filters.q.replace(/[\\%_]/g, "\\$&")}%` : null,
  filters.sport ?? null,
  filters.accessible ?? null,
];
const pageWindow = (page: PageRequest) => [
  page.size,
  (page.page - 1) * page.size,
];
const firstPhoto = (alias: string) =>
  `(SELECT json_build_object('id', p.id, 'version', left(p.sha256, 16), 'gl', p.alt_gl, 'es', p.alt_es)
    FROM facility_photos p WHERE p.tenant_id=${alias}.tenant_id AND p.facility_id=${alias}.id
    ORDER BY p.position, p.created_at LIMIT 1)`;
@Injectable()
export class PostgresFacilityRepository extends FacilityRepository {
  constructor(private readonly db: Database) {
    super();
  }
  async catalog(filters: CatalogFilters, page: PageRequest) {
    const { rows } = await this.db.query<
      Omit<CatalogEntry, "municipality" | "photo"> & {
        municipalitySlug: string;
        municipalityName: string;
        photo: { id: string; version: string; gl: string; es: string } | null;
        total: string;
      }
    >(
      `SELECT f.id, f.name, f.sport, f.address, f.description, f.accessible, f.status,
        f.slot_minutes AS "slotMinutes", f.price_cents AS "priceCents", f.latitude, f.longitude,
        m.slug AS "municipalitySlug", m.name AS "municipalityName",
        json_build_object('gl', s.name_gl, 'es', s.name_es) AS "sportName",
        ${firstPhoto("f")} AS photo, count(*) OVER() AS total
      FROM facilities f JOIN municipalities m ON m.id=f.tenant_id
        JOIN sports s ON s.tenant_id=f.tenant_id AND s.code=f.sport
      WHERE f.status='active' AND ${filtered("f")}
        AND (cardinality($4::text[])=0 OR m.slug=ANY($4))
      ORDER BY m.name, f.name, f.id LIMIT $6 OFFSET $7`,
      [
        ...filterValues(filters),
        filters.municipalities,
        null,
        ...pageWindow(page),
      ],
    );
    return {
      items: rows.map(
        ({
          municipalitySlug,
          municipalityName,
          photo,
          total: _,
          ...facility
        }) => ({
          ...facility,
          municipality: { slug: municipalitySlug, name: municipalityName },
          photo: photo && {
            id: photo.id,
            version: photo.version,
            alt: { gl: photo.gl, es: photo.es },
          },
        }),
      ),
      total: await this.total(rows, page, () =>
        this.db.query<{ total: string }>(
          `SELECT count(*) AS total FROM facilities f JOIN municipalities m ON m.id=f.tenant_id
          WHERE f.status='active' AND ${filtered("f")} AND (cardinality($4::text[])=0 OR m.slug=ANY($4))`,
          [...filterValues(filters), filters.municipalities, null],
        ),
      ),
    };
  }
  async search(tenantId: string, filters: FacilityFilters, page: PageRequest) {
    const { rows } = await this.db.query<Facility & { total: string }>(
      `SELECT ${fields}, count(*) OVER() AS total FROM facilities
      WHERE tenant_id=$4 AND ${filtered("facilities")}
      ORDER BY array_position(ARRAY['active','maintenance','closed'], status), name, id
      LIMIT $6 OFFSET $7`,
      [
        ...filterValues(filters),
        tenantId,
        filters.hideClosed ?? false,
        ...pageWindow(page),
      ],
    );
    return {
      items: rows.map(({ total: _, ...facility }) => facility),
      total: await this.total(rows, page, () =>
        this.db.query<{ total: string }>(
          `SELECT count(*) AS total FROM facilities WHERE tenant_id=$4 AND ${filtered("facilities")}`,
          [...filterValues(filters), tenantId, filters.hideClosed ?? false],
        ),
      ),
    };
  }
  /** Total from the window count, or a count query when the page is past the end. */
  private async total(
    rows: readonly { total: string }[],
    page: PageRequest,
    count: () => Promise<{ rows: { total: string }[] }>,
  ) {
    if (rows.length) return Number(rows[0].total);
    return page.page > 1 ? Number((await count()).rows[0].total) : 0;
  }
  async list(tenantId: string) {
    return (
      await this.db.query<Facility>(
        `SELECT ${fields} FROM facilities WHERE tenant_id=$1 ORDER BY name`,
        [tenantId],
      )
    ).rows;
  }
  async find(tenantId: string, id: string, lock = false) {
    return (
      (
        await this.db.query<Facility>(
          `SELECT ${fields} FROM facilities WHERE tenant_id=$1 AND id=$2${lock ? " FOR UPDATE" : ""}`,
          [tenantId, id],
        )
      ).rows[0] ?? null
    );
  }
  async save(value: Facility) {
    const result = await this.db.query(
      `INSERT INTO facilities (id,tenant_id,name,sport,address,description,accessible,status,slot_minutes,price_cents,opening_calendar,rules,follows_municipal_holidays,latitude,longitude) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15) ON CONFLICT(id) DO UPDATE SET name=$3,sport=$4,address=$5,description=$6,accessible=$7,status=$8,slot_minutes=$9,price_cents=$10,opening_calendar=$11,rules=$12,follows_municipal_holidays=$13,latitude=$14,longitude=$15 WHERE facilities.tenant_id=$2 RETURNING id`,
      [
        value.id,
        value.tenantId,
        value.name,
        value.sport,
        value.address,
        value.description,
        value.accessible,
        value.status,
        value.slotMinutes,
        value.priceCents,
        value.openingCalendar,
        value.rules,
        value.followsMunicipalHolidays,
        value.latitude,
        value.longitude,
      ],
    );
    if (!result.rowCount) return Result.err(failure("id_reused"));
    await this.db.query(
      "DELETE FROM facility_prices WHERE tenant_id=$1 AND facility_id=$2",
      [value.tenantId, value.id],
    );
    for (const price of value.prices)
      await this.db.query(
        "INSERT INTO facility_prices (tenant_id,facility_id,category,price_cents) VALUES ($1,$2,$3,$4)",
        [value.tenantId, value.id, price.category, price.priceCents],
      );
    return Result.ok();
  }
  async recordStatus(
    tenantId: string,
    id: string,
    status: Facility["status"],
    at: Temporal.Instant,
  ) {
    await this.db.query(
      "UPDATE facility_status_periods SET ends_at=$3 WHERE tenant_id=$1 AND facility_id=$2 AND ends_at IS NULL",
      [tenantId, id, at.toString()],
    );
    await this.db.query(
      "INSERT INTO facility_status_periods (tenant_id,facility_id,status,starts_at) VALUES ($1,$2,$3,$4)",
      [tenantId, id, status, at.toString()],
    );
  }
  async upcomingBookings(tenantId: string, id: string, now: Temporal.Instant) {
    const { rows } = await this.db.query<{
      id: string;
      userId: string;
      start: string;
      end: string;
    }>(
      'SELECT id, user_id AS "userId", starts_at AS "start", ends_at AS "end" FROM bookings WHERE tenant_id=$1 AND facility_id=$2 AND status=\'confirmed\' AND ends_at>$3 AND user_id IS NOT NULL ORDER BY starts_at',
      [tenantId, id, now.toString()],
    );
    return rows.map((row) => ({
      ...row,
      start: Temporal.Instant.from(row.start),
      end: Temporal.Instant.from(row.end),
    }));
  }
  async cancelBookings(args: {
    tenantId: string;
    bookings: readonly { id: string; userId: string; notificationId: string }[];
    reason: string;
    at: Temporal.Instant;
  }) {
    if (!args.bookings.length) return;
    // Cancelling also frees the occupied units, in the same statement.
    await this.db.query(
      "WITH cancelled AS (UPDATE bookings SET status='cancelled', cancelled_at=$3, cancelled_by='municipality', cancellation_reason=$4 WHERE tenant_id=$1 AND id=ANY($2::uuid[]) AND status='confirmed' RETURNING id) DELETE FROM booking_units u USING cancelled c WHERE u.tenant_id=$1 AND u.booking_id=c.id",
      [
        args.tenantId,
        args.bookings.map((booking) => booking.id),
        args.at.toString(),
        args.reason,
      ],
    );
    await this.db.query(
      "INSERT INTO notifications (id,tenant_id,user_id,booking_id,kind,created_at,details) SELECT n.id,$1,n.user_id,n.booking_id,'cancelled_by_municipality',$5,jsonb_build_object('reason',$6::text) FROM unnest($2::uuid[],$3::uuid[],$4::uuid[]) AS n(id,user_id,booking_id)",
      [
        args.tenantId,
        args.bookings.map((booking) => booking.notificationId),
        args.bookings.map((booking) => booking.userId),
        args.bookings.map((booking) => booking.id),
        args.at.toString(),
        args.reason,
      ],
    );
  }
  async busy(
    tenantId: string,
    id: string,
    start: Temporal.Instant,
    end: Temporal.Instant,
  ) {
    const { rows } = await this.db.query<{
      unitId: string;
      start: string;
      end: string;
      season: boolean;
    }>(
      'SELECT u.unit_id AS "unitId",u.starts_at AS start,u.ends_at AS end,u.occurrence_id IS NOT NULL AS season FROM booking_units u JOIN resources r ON r.tenant_id=u.tenant_id AND r.id=u.unit_id WHERE r.tenant_id=$1 AND r.facility_id=$2 AND u.starts_at<$4 AND u.ends_at>$3',
      [tenantId, id, start.toString(), end.toString()],
    );
    return rows.map((row) => ({
      unitId: row.unitId,
      start: Temporal.Instant.from(row.start),
      end: Temporal.Instant.from(row.end),
      season: row.season,
    }));
  }
}
