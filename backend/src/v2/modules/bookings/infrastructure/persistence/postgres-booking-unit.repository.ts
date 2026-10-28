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
  }) {
    await this.release(args.tenantId, args.bookingId);
    try {
      await this.db.query(
        "INSERT INTO booking_units (tenant_id,booking_id,unit_id,starts_at,ends_at) SELECT $1,$2,unit,$4,$5 FROM unnest($3::uuid[]) AS unit",
        [
          args.tenantId,
          args.bookingId,
          [...args.unitIds],
          args.start.toString(),
          args.end.toString(),
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
