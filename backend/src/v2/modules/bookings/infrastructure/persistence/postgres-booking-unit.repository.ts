// SPDX-License-Identifier: AGPL-3.0-or-later
import { Injectable } from "@nestjs/common";
import { Temporal } from "@js-temporal/polyfill";
import { BookingUnitRepository } from "../../domain/booking-unit.repository";
import { Database } from "../../../../shared/infrastructure/database";
import { Result } from "../../../../shared/application/result";
import { failure } from "../../../../shared/application/errors";
@Injectable()
export class PostgresBookingUnitRepository extends BookingUnitRepository {
  constructor(private readonly db: Database) {
    super();
  }
  async replace(args: {
    tenantId: string;
    bookingId: string;
    unitIds: readonly string[];
    start: Temporal.Instant;
    end: Temporal.Instant;
    place: { capacity: number; userId: string } | null;
  }) {
    await this.release(args.tenantId, args.bookingId);
    // Slots follow the facility's grid, so the rows that overlap the interval are the places taken.
    const { rows } = await this.db.query<{
      places: number;
      exclusive: boolean;
      mine: boolean;
    }>(
      `SELECT count(*) FILTER (WHERE u.shared)::int AS places,
        bool_or(NOT u.shared) IS TRUE AS exclusive,
        bool_or(u.shared AND b.user_id=$5) IS TRUE AS mine
      FROM booking_units u LEFT JOIN bookings b ON b.tenant_id=u.tenant_id AND b.id=u.booking_id
      WHERE u.tenant_id=$1 AND u.unit_id=ANY($2::uuid[]) AND u.starts_at<$4 AND u.ends_at>$3`,
      [
        args.tenantId,
        [...args.unitIds],
        args.start.toString(),
        args.end.toString(),
        args.place?.userId ?? null,
      ],
    );
    const taken = rows[0]!;
    if (args.place) {
      if (taken.mine) return Result.err(failure("already_booked"));
      if (taken.exclusive || taken.places >= args.place.capacity)
        return Result.err(failure("slot_taken"));
    } else if (taken.places) return Result.err(failure("slot_taken"));
    try {
      await this.db.query(
        "INSERT INTO booking_units (tenant_id,booking_id,unit_id,starts_at,ends_at,shared) SELECT $1,$2,unit,$4,$5,$6 FROM unnest($3::uuid[]) AS unit",
        [
          args.tenantId,
          args.bookingId,
          [...args.unitIds],
          args.start.toString(),
          args.end.toString(),
          args.place !== null,
        ],
      );
      return Result.ok();
    } catch (error) {
      const pg = error as { code?: string; constraint?: string };
      if (pg.code === "23P01" && pg.constraint === "booking_units_no_overlap")
        return Result.err(failure("slot_taken"));
      throw error;
    }
  }
  async release(tenantId: string, bookingId: string) {
    await this.db.query(
      "DELETE FROM booking_units WHERE tenant_id=$1 AND booking_id=$2",
      [tenantId, bookingId],
    );
  }
}
