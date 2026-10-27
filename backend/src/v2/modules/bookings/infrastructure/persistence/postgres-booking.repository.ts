// SPDX-License-Identifier: AGPL-3.0-or-later
import { Injectable } from "@nestjs/common";
import { Temporal } from "@js-temporal/polyfill";
import { BookingRepository } from "../../domain/booking.repository";
import { Booking } from "../../domain/booking.entity";
import { Database } from "../../../../shared/infrastructure/database";
import { Result } from "../../../../shared/application/result";
import { failure } from "../../../../shared/application/errors";
import { TariffCategory } from "../../../../shared/application/categories";
interface Row {
  id: string;
  tenant_id: string;
  user_id: string;
  facility_id: string;
  starts_at: string;
  ends_at: string;
  created_at: string;
  cancelled_at: string | null;
  cancellation_hours: number | null;
  tariff_category: TariffCategory | null;
  price_cents: number | null;
  status: string;
  facility_name: string;
  sport: string;
}
function toDomain(row: Row): Booking {
  const base = {
    id: row.id,
    tenantId: row.tenant_id,
    userId: row.user_id,
    facilityId: row.facility_id,
    start: Temporal.Instant.from(row.starts_at),
    end: Temporal.Instant.from(row.ends_at),
    createdAt: Temporal.Instant.from(row.created_at),
    cancellationHours: row.cancellation_hours,
    tariffCategory: row.tariff_category,
    priceCents: row.price_cents,
  };
  if (row.status === "confirmed" && row.cancelled_at === null)
    return { ...base, status: "confirmed" };
  if (row.status === "cancelled" && row.cancelled_at !== null)
    return {
      ...base,
      status: "cancelled",
      cancelledAt: Temporal.Instant.from(row.cancelled_at),
    };
  throw new Error("Corrupt booking state");
}
@Injectable()
export class PostgresBookingRepository extends BookingRepository {
  constructor(private readonly db: Database) {
    super();
  }
  async lockUser(tenantId: string, userId: string) {
    await this.db.query(
      "SELECT id FROM users WHERE tenant_id=$1 AND id=$2 FOR UPDATE",
      [tenantId, userId],
    );
  }
  async find(tenantId: string, userId: string, id: string) {
    const { rows } = await this.db.query<Row>(
      "SELECT * FROM bookings WHERE tenant_id=$1 AND user_id=$2 AND id=$3",
      [tenantId, userId, id],
    );
    return rows[0] ? toDomain(rows[0]) : null;
  }
  async list(tenantId: string, userId: string) {
    const { rows } = await this.db.query<Row>(
      "SELECT b.*,f.name AS facility_name,f.sport FROM bookings b JOIN facilities f ON f.tenant_id=b.tenant_id AND f.id=b.facility_id WHERE b.tenant_id=$1 AND b.user_id=$2 ORDER BY b.starts_at DESC LIMIT 200",
      [tenantId, userId],
    );
    return rows.map((row) => ({
      booking: toDomain(row),
      facilityName: row.facility_name,
      sport: row.sport,
    }));
  }
  async countActive(tenantId: string, userId: string, now: Temporal.Instant) {
    return Number(
      (
        await this.db.query<{ count: string }>(
          "SELECT count(*) FROM bookings WHERE tenant_id=$1 AND user_id=$2 AND status='confirmed' AND ends_at>$3",
          [tenantId, userId, now.toString()],
        )
      ).rows[0].count,
    );
  }
  async save(value: Booking) {
    try {
      await this.db
        .query(
          "INSERT INTO bookings (id,tenant_id,user_id,facility_id,starts_at,ends_at,status,created_at,cancelled_at,cancellation_hours,tariff_category,price_cents) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) ON CONFLICT(id) DO UPDATE SET starts_at=$5,ends_at=$6,status=$7,cancelled_at=$9,cancellation_hours=$10,tariff_category=$11,price_cents=$12 WHERE bookings.tenant_id=$2 AND bookings.user_id=$3 RETURNING id",
          [
            value.id,
            value.tenantId,
            value.userId,
            value.facilityId,
            value.start.toString(),
            value.end.toString(),
            value.status,
            value.createdAt.toString(),
            value.status === "cancelled" ? value.cancelledAt.toString() : null,
            value.cancellationHours,
            value.tariffCategory,
            value.priceCents,
          ],
        )
        .then((result) => {
          if (result.rowCount === 0)
            throw Object.assign(new Error("Id belongs to another owner"), {
              code: "23505",
            });
        });
      return Result.ok();
    } catch (error) {
      const pg = error as { code?: string; constraint?: string };
      if (pg.code === "23P01" && pg.constraint === "bookings_no_overlap")
        return Result.err(failure("slot_taken"));
      if (pg.code === "23505") return Result.err(failure("id_reused"));
      throw error;
    }
  }
}
