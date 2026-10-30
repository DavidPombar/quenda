// SPDX-License-Identifier: AGPL-3.0-or-later
import { Injectable } from "@nestjs/common";
import { Outbox } from "../application/outbox";
import { noticeKindOf, wants } from "../application/notice-preferences";
import { Database } from "./database";
@Injectable()
export class PostgresOutbox extends Outbox {
  constructor(private readonly db: Database) {
    super();
  }
  async enqueue(args: Parameters<Outbox["enqueue"]>[0]) {
    const { rowCount } = await this.db.query(
      // Email and push follow the person's choice (the default when there is no row); push also
      // needs a device. Webhooks are only queued for municipalities with a connector configured.
      `INSERT INTO outbox (id,tenant_id,user_id,booking_id,kind,channel,dedupe_key,created_at,available_at)
        SELECT $1,$2,$3,$4,$5,$6,$7,$8,$8
        WHERE CASE $6
          WHEN 'webhook' THEN EXISTS (SELECT 1 FROM municipalities WHERE id=$2 AND access_webhook_url <> '')
          ELSE COALESCE(
              (SELECT enabled FROM notification_preferences
                WHERE tenant_id=$2 AND user_id=$3 AND kind=$9 AND channel=$6),
              $10::boolean)
            AND ($6 <> 'push' OR EXISTS (SELECT 1 FROM push_subscriptions WHERE tenant_id=$2 AND user_id=$3))
        END
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
        noticeKindOf(args.kind),
        args.channel === "webhook"
          ? false
          : wants(args.kind, args.channel, null),
      ],
    );
    return (rowCount ?? 0) > 0;
  }
}
