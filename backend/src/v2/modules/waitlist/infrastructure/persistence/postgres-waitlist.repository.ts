// SPDX-License-Identifier: AGPL-3.0-or-later
import { Injectable } from "@nestjs/common";
import { Temporal } from "@js-temporal/polyfill";
import { Database } from "../../../../shared/infrastructure/database";
import { WaitlistRepository } from "../../domain/waitlist.repository";
import {
  WaitlistEntry,
  WaitlistEntryView,
  WaitlistStatus,
} from "../../domain/waitlist-entry.entity";
const columns =
  'w.id, w.tenant_id AS "tenantId", w.user_id AS "userId", w.facility_id AS "facilityId", w.resource_id AS "resourceId", w.starts_at AS start, w.ends_at AS "end", w.created_at AS "createdAt", w.status, w.offered_at AS "offeredAt", w.offer_expires_at AS "offerExpiresAt"';
interface Row {
  id: string;
  tenantId: string;
  userId: string;
  facilityId: string;
  resourceId: string;
  start: string;
  end: string;
  createdAt: string;
  status: WaitlistStatus;
  offeredAt: string | null;
  offerExpiresAt: string | null;
}
function toDomain(row: Row): WaitlistEntry {
  return {
    id: row.id,
    tenantId: row.tenantId,
    userId: row.userId,
    facilityId: row.facilityId,
    resourceId: row.resourceId,
    start: Temporal.Instant.from(row.start),
    end: Temporal.Instant.from(row.end),
    createdAt: Temporal.Instant.from(row.createdAt),
    status: row.status,
    offeredAt: row.offeredAt ? Temporal.Instant.from(row.offeredAt) : null,
    offerExpiresAt: row.offerExpiresAt
      ? Temporal.Instant.from(row.offerExpiresAt)
      : null,
  };
}
@Injectable()
export class PostgresWaitlistRepository extends WaitlistRepository {
  constructor(private readonly db: Database) {
    super();
  }
  async add(entry: WaitlistEntry) {
    await this.db.query(
      "INSERT INTO waitlist_entries (id,tenant_id,user_id,facility_id,resource_id,starts_at,ends_at,created_at,status) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)",
      [
        entry.id,
        entry.tenantId,
        entry.userId,
        entry.facilityId,
        entry.resourceId,
        entry.start.toString(),
        entry.end.toString(),
        entry.createdAt.toString(),
        entry.status,
      ],
    );
  }
  async find(tenantId: string, id: string) {
    const row = (
      await this.db.query<Row>(
        `SELECT ${columns} FROM waitlist_entries w WHERE w.tenant_id=$1 AND w.id=$2`,
        [tenantId, id],
      )
    ).rows[0];
    return row ? toDomain(row) : null;
  }
  async findOpen(args: Parameters<WaitlistRepository["findOpen"]>[0]) {
    const row = (
      await this.db.query<Row>(
        `SELECT ${columns} FROM waitlist_entries w WHERE w.tenant_id=$1 AND w.user_id=$2 AND w.resource_id=$3 AND w.starts_at=$4 AND w.status IN ('waiting','offered')`,
        [args.tenantId, args.userId, args.resourceId, args.start.toString()],
      )
    ).rows[0];
    return row ? toDomain(row) : null;
  }
  async countOpen(tenantId: string, userId: string) {
    return (
      await this.db.query<{ count: number }>(
        "SELECT count(*)::int AS count FROM waitlist_entries WHERE tenant_id=$1 AND user_id=$2 AND status IN ('waiting','offered')",
        [tenantId, userId],
      )
    ).rows[0]!.count;
  }
  async hasBooking(args: Parameters<WaitlistRepository["hasBooking"]>[0]) {
    return (
      await this.db.query<{ found: boolean }>(
        "SELECT EXISTS (SELECT 1 FROM bookings WHERE tenant_id=$1 AND user_id=$2 AND resource_id=$3 AND status='confirmed' AND starts_at<$5 AND ends_at>$4) AS found",
        [
          args.tenantId,
          args.userId,
          args.resourceId,
          args.start.toString(),
          args.end.toString(),
        ],
      )
    ).rows[0]!.found;
  }
  async listOpen(tenantId: string, userId: string) {
    const { rows } = await this.db.query<
      Row & { facilityName: string; resourceName: string; position: number }
    >(
      `SELECT ${columns}, f.name AS "facilityName", r.name AS "resourceName",
        CASE WHEN w.status='offered' THEN 0 ELSE (
          SELECT count(*)::int + 1 FROM waitlist_entries o
          WHERE o.tenant_id=w.tenant_id AND o.resource_id=w.resource_id AND o.starts_at=w.starts_at
            AND o.status='waiting' AND (o.created_at, o.id) < (w.created_at, w.id)) END AS position
      FROM waitlist_entries w
      JOIN facilities f ON f.tenant_id=w.tenant_id AND f.id=w.facility_id
      JOIN resources r ON r.tenant_id=w.tenant_id AND r.id=w.resource_id
      WHERE w.tenant_id=$1 AND w.user_id=$2 AND w.status IN ('waiting','offered')
      ORDER BY w.starts_at, r.position, r.name`,
      [tenantId, userId],
    );
    return rows.map((row): WaitlistEntryView => ({
      ...toDomain(row),
      facilityName: row.facilityName,
      resourceName: row.resourceName,
      position: row.position,
    }));
  }
  async queue(args: Parameters<WaitlistRepository["queue"]>[0]) {
    const { rows } = await this.db.query<Row>(
      `SELECT ${columns} FROM waitlist_entries w
      WHERE w.tenant_id=$1 AND w.facility_id=$2 AND w.status='waiting'
        AND w.starts_at<$4 AND w.ends_at>$3 AND w.starts_at>$5
      ORDER BY w.created_at, w.id`,
      [
        args.tenantId,
        args.facilityId,
        args.start.toString(),
        args.end.toString(),
        args.now.toString(),
      ],
    );
    return rows.map(toDomain);
  }
  async offer(
    tenantId: string,
    id: string,
    at: Temporal.Instant,
    expiresAt: Temporal.Instant,
  ) {
    await this.db.query(
      "UPDATE waitlist_entries SET status='offered', offered_at=$3, offer_expires_at=$4 WHERE tenant_id=$1 AND id=$2 AND status='waiting'",
      [tenantId, id, at.toString(), expiresAt.toString()],
    );
  }
  async accept(args: Parameters<WaitlistRepository["accept"]>[0]) {
    const row = (
      await this.db.query<Row>(
        `UPDATE waitlist_entries w SET status='accepted', booking_id=$6
        WHERE w.tenant_id=$1 AND w.user_id=$2 AND w.id=$3 AND w.resource_id=$4 AND w.starts_at=$5
          AND w.status='offered' AND w.offer_expires_at>$7
        RETURNING ${columns}`,
        [
          args.tenantId,
          args.userId,
          args.id,
          args.resourceId,
          args.start.toString(),
          args.bookingId,
          args.now.toString(),
        ],
      )
    ).rows[0];
    return row ? toDomain(row) : null;
  }
  async end(
    tenantId: string,
    id: string,
    status: "expired" | "left" | "closed",
  ) {
    const open = status === "expired" ? ["offered"] : ["waiting", "offered"];
    const row = (
      await this.db.query<Row>(
        `SELECT ${columns} FROM waitlist_entries w WHERE w.tenant_id=$1 AND w.id=$2 AND w.status = ANY($3::text[]) FOR UPDATE`,
        [tenantId, id, open],
      )
    ).rows[0];
    if (!row) return null;
    await this.db.query(
      "UPDATE waitlist_entries SET status=$3, offer_expires_at=NULL WHERE tenant_id=$1 AND id=$2",
      [tenantId, id, status],
    );
    return toDomain(row);
  }
  async expiredOffers(tenantId: string, now: Temporal.Instant) {
    const { rows } = await this.db.query<Row>(
      `SELECT ${columns} FROM waitlist_entries w WHERE w.tenant_id=$1 AND w.status='offered' AND w.offer_expires_at<=$2 ORDER BY w.offer_expires_at`,
      [tenantId, now.toString()],
    );
    return rows.map(toDomain);
  }
  async openOfFacility(tenantId: string, facilityId: string) {
    const { rows } = await this.db.query<Row>(
      `SELECT ${columns} FROM waitlist_entries w WHERE w.tenant_id=$1 AND w.facility_id=$2 AND w.status IN ('waiting','offered')`,
      [tenantId, facilityId],
    );
    return rows.map(toDomain);
  }
  async openOfUser(tenantId: string, userId: string) {
    const { rows } = await this.db.query<Row>(
      `SELECT ${columns} FROM waitlist_entries w WHERE w.tenant_id=$1 AND w.user_id=$2 AND w.status IN ('waiting','offered')`,
      [tenantId, userId],
    );
    return rows.map(toDomain);
  }
  async deleteOfUser(tenantId: string, userId: string) {
    await this.db.query(
      "DELETE FROM booking_units u USING waitlist_entries w WHERE u.tenant_id=w.tenant_id AND u.waitlist_entry_id=w.id AND w.tenant_id=$1 AND w.user_id=$2",
      [tenantId, userId],
    );
    await this.db.query(
      "DELETE FROM waitlist_entries WHERE tenant_id=$1 AND user_id=$2",
      [tenantId, userId],
    );
  }
  async deletePast(tenantId: string, now: Temporal.Instant) {
    await this.db.query(
      "DELETE FROM booking_units u USING waitlist_entries w WHERE u.tenant_id=w.tenant_id AND u.waitlist_entry_id=w.id AND w.tenant_id=$1 AND w.ends_at<=$2",
      [tenantId, now.toString()],
    );
    const { rowCount } = await this.db.query(
      "DELETE FROM waitlist_entries WHERE tenant_id=$1 AND ends_at<=$2",
      [tenantId, now.toString()],
    );
    return rowCount ?? 0;
  }
  async recordOutcome(
    args: Parameters<WaitlistRepository["recordOutcome"]>[0],
  ) {
    const column = args.outcome === "accepted" ? "accepted" : "expired";
    await this.db.query(
      `INSERT INTO waitlist_outcomes (tenant_id,facility_id,day,${column}) VALUES ($1,$2,$3,1)
      ON CONFLICT (tenant_id,facility_id,day) DO UPDATE SET ${column}=waitlist_outcomes.${column}+1`,
      [args.tenantId, args.facilityId, args.day.toString()],
    );
  }
}
