// SPDX-License-Identifier: AGPL-3.0-or-later
import { Injectable } from "@nestjs/common";
import { Temporal } from "@js-temporal/polyfill";
import { BookingRepository } from "../../domain/booking.repository";
import { Booking } from "../../domain/booking.entity";
import { Database } from "../../../../shared/infrastructure/database";
import { Result } from "../../../../shared/application/result";
import { failure } from "../../../../shared/application/errors";
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
  cancelled_by: "citizen" | "municipality" | null;
  cancellation_reason: string | null;
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
  };
  if (row.status === "confirmed" && row.cancelled_at === null)
    return { ...base, status: "confirmed" };
  if (row.status === "no_show" && row.cancelled_at === null)
    return { ...base, status: "no_show" };
  if (row.status === "cancelled" && row.cancelled_at !== null)
    return {
      ...base,
      status: "cancelled",
      cancelledAt: Temporal.Instant.from(row.cancelled_at),
      cancelledBy: row.cancelled_by,
      cancellationReason: row.cancellation_reason,
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
  async findInTenant(tenantId: string, id: string) {
    const { rows } = await this.db.query<Row>(
      "SELECT * FROM bookings WHERE tenant_id=$1 AND id=$2 AND user_id IS NOT NULL",
      [tenantId, id],
    );
    return rows[0] ? toDomain(rows[0]) : null;
  }
  async listStarting(args: {
    tenantId: string;
    from: Temporal.Instant;
    to: Temporal.Instant;
    facilityId?: string;
  }) {
    const { rows } = await this.db.query<Row & { display_name: string }>(
      "SELECT b.*,f.name AS facility_name,f.sport,u.display_name FROM bookings b JOIN facilities f ON f.tenant_id=b.tenant_id AND f.id=b.facility_id JOIN users u ON u.tenant_id=b.tenant_id AND u.id=b.user_id WHERE b.tenant_id=$1 AND b.starts_at>=$2 AND b.starts_at<$3 AND ($4::uuid IS NULL OR b.facility_id=$4) ORDER BY b.starts_at, f.name LIMIT 500",
      [
        args.tenantId,
        args.from.toString(),
        args.to.toString(),
        args.facilityId ?? null,
      ],
    );
    return rows.map((row) => ({
      booking: toDomain(row),
      facilityName: row.facility_name,
      sport: row.sport,
      displayName: row.display_name,
    }));
  }
  async noShowStarts(
    tenantId: string,
    userId: string,
    since: Temporal.Instant,
  ) {
    const { rows } = await this.db.query<{ starts_at: string }>(
      "SELECT starts_at FROM bookings WHERE tenant_id=$1 AND user_id=$2 AND status='no_show' AND starts_at>=$3 ORDER BY starts_at",
      [tenantId, userId, since.toString()],
    );
    return rows.map((row) => Temporal.Instant.from(row.starts_at));
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
          "INSERT INTO bookings (id,tenant_id,user_id,facility_id,starts_at,ends_at,status,created_at,cancelled_at,cancellation_hours,cancelled_by,cancellation_reason) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) ON CONFLICT(id) DO UPDATE SET starts_at=$5,ends_at=$6,status=$7,cancelled_at=$9,cancellation_hours=$10,cancelled_by=$11,cancellation_reason=$12 WHERE bookings.tenant_id=$2 AND bookings.user_id=$3 RETURNING id",
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
            value.status === "cancelled" ? value.cancelledBy : null,
            value.status === "cancelled" ? value.cancellationReason : null,
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
