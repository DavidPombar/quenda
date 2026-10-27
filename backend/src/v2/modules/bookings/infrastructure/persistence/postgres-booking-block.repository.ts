// SPDX-License-Identifier: AGPL-3.0-or-later
import { Injectable } from "@nestjs/common";
import { Temporal } from "@js-temporal/polyfill";
import {
  BookingBlock,
  BookingBlockRepository,
} from "../../domain/booking-block.repository";
import { Database } from "../../../../shared/infrastructure/database";
@Injectable()
export class PostgresBookingBlockRepository extends BookingBlockRepository {
  constructor(private readonly db: Database) {
    super();
  }
  async active(tenantId: string, userId: string, now: Temporal.Instant) {
    const { rows } = await this.db.query<{
      id: string;
      bookingId: string;
      start: string;
      end: string;
    }>(
      'SELECT id, booking_id AS "bookingId", starts_at AS "start", ends_at AS "end" FROM booking_blocks WHERE tenant_id=$1 AND user_id=$2 AND lifted_at IS NULL AND starts_at<=$3 AND ends_at>$3 ORDER BY ends_at DESC LIMIT 1',
      [tenantId, userId, now.toString()],
    );
    const row = rows[0];
    return row
      ? {
          id: row.id,
          tenantId,
          userId,
          bookingId: row.bookingId,
          start: Temporal.Instant.from(row.start),
          end: Temporal.Instant.from(row.end),
        }
      : null;
  }
  async add(block: BookingBlock) {
    await this.db.query(
      "INSERT INTO booking_blocks (id,tenant_id,user_id,booking_id,starts_at,ends_at) VALUES ($1,$2,$3,$4,$5,$6)",
      [
        block.id,
        block.tenantId,
        block.userId,
        block.bookingId,
        block.start.toString(),
        block.end.toString(),
      ],
    );
  }
  async lift(tenantId: string, id: string, at: Temporal.Instant) {
    await this.db.query(
      "UPDATE booking_blocks SET lifted_at=$3 WHERE tenant_id=$1 AND id=$2 AND lifted_at IS NULL",
      [tenantId, id, at.toString()],
    );
  }
}
