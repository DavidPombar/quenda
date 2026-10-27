// SPDX-License-Identifier: AGPL-3.0-or-later
import { Injectable } from "@nestjs/common";
import { Outbox } from "../application/outbox";
import { Database } from "./database";
@Injectable()
export class PostgresOutbox extends Outbox {
  constructor(private readonly db: Database) {
    super();
  }
  async enqueue(args: Parameters<Outbox["enqueue"]>[0]) {
    const { rowCount } = await this.db.query(
      // Webhook messages are only queued for municipalities with a connector configured.
      `INSERT INTO outbox (id,tenant_id,user_id,booking_id,kind,channel,dedupe_key,created_at,available_at)
        SELECT $1,$2,$3,$4,$5,$6,$7,$8,$8
        WHERE $6 <> 'webhook' OR EXISTS (SELECT 1 FROM municipalities WHERE id=$2 AND access_webhook_url <> '')
        ON CONFLICT (dedupe_key) DO NOTHING`,
      [
        args.id,
        args.tenantId,
        args.userId,
        args.bookingId,
        args.kind,
        args.channel,
        args.dedupeKey,
        args.createdAt.toString(),
      ],
    );
    return (rowCount ?? 0) > 0;
  }
}
