// SPDX-License-Identifier: AGPL-3.0-or-later
import { createHash, randomBytes } from "node:crypto";
import { Injectable } from "@nestjs/common";
import { Temporal } from "@js-temporal/polyfill";
import {
  CalendarFeedOwner,
  CalendarFeedRepository,
} from "../../domain/calendar-feed.repository";
import { Database } from "../../../../shared/infrastructure/database";
function hash(token: string) {
  return createHash("sha256").update(token).digest("hex");
}
@Injectable()
export class PostgresCalendarFeedRepository extends CalendarFeedRepository {
  constructor(private readonly db: Database) {
    super();
  }
  async rotate(owner: CalendarFeedOwner, createdAt: Temporal.Instant) {
    const token = randomBytes(32).toString("hex");
    await this.db.query(
      "INSERT INTO calendar_feeds (tenant_id,user_id,token_hash,created_at) VALUES ($1,$2,$3,$4) ON CONFLICT (tenant_id,user_id) DO UPDATE SET token_hash=$3,created_at=$4",
      [owner.tenantId, owner.userId, hash(token), createdAt.toString()],
    );
    return token;
  }
  async revoke(owner: CalendarFeedOwner) {
    await this.db.query(
      "DELETE FROM calendar_feeds WHERE tenant_id=$1 AND user_id=$2",
      [owner.tenantId, owner.userId],
    );
  }
  async createdAt(owner: CalendarFeedOwner) {
    const { rows } = await this.db.query<{ created_at: string }>(
      "SELECT created_at FROM calendar_feeds WHERE tenant_id=$1 AND user_id=$2",
      [owner.tenantId, owner.userId],
    );
    return rows[0] ? Temporal.Instant.from(rows[0].created_at) : null;
  }
  async findOwner(token: string) {
    const { rows } = await this.db.query<CalendarFeedOwner>(
      'SELECT tenant_id AS "tenantId", user_id AS "userId" FROM calendar_feeds WHERE token_hash=$1',
      [hash(token)],
    );
    return rows[0] ?? null;
  }
}
