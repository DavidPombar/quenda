// SPDX-License-Identifier: AGPL-3.0-or-later
import { Injectable } from "@nestjs/common";
import type { Temporal } from "@js-temporal/polyfill";
import { Database } from "../../../../shared/infrastructure/database";
import { RetentionRepository } from "../../domain/retention.repository";
@Injectable()
export class PostgresRetentionRepository extends RetentionRepository {
  constructor(private readonly db: Database) {
    super();
  }
  private async run(sql: string, tenantId: string, instant: Temporal.Instant) {
    return (
      (await this.db.query(sql, [tenantId, instant.toString()])).rowCount ?? 0
    );
  }
  detachBookings(tenantId: string, cutoff: Temporal.Instant) {
    return this.run(
      "UPDATE bookings SET user_id=NULL WHERE tenant_id=$1 AND user_id IS NOT NULL AND ends_at<$2",
      tenantId,
      cutoff,
    );
  }
  deleteNotifications(tenantId: string, cutoff: Temporal.Instant) {
    return this.run(
      "DELETE FROM notifications WHERE tenant_id=$1 AND created_at<$2",
      tenantId,
      cutoff,
    );
  }
  deleteBlocks(tenantId: string, cutoff: Temporal.Instant) {
    return this.run(
      "DELETE FROM booking_blocks WHERE tenant_id=$1 AND ends_at<$2",
      tenantId,
      cutoff,
    );
  }
  pseudonymiseAudit(tenantId: string, cutoff: Temporal.Instant) {
    return this.run(
      "UPDATE audit_events SET actor_id=NULL WHERE tenant_id=$1 AND actor_id IS NOT NULL AND occurred_at<$2",
      tenantId,
      cutoff,
    );
  }
  purgeSessions(tenantId: string, now: Temporal.Instant) {
    return this.run(
      "DELETE FROM sessions WHERE tenant_id=$1 AND expires_at<$2",
      tenantId,
      now,
    );
  }
  purgeLoginAttempts(tenantId: string, now: Temporal.Instant) {
    return this.run(
      "DELETE FROM login_attempts WHERE tenant_id=$1 AND expires_at<$2",
      tenantId,
      now,
    );
  }
  deleteConsentsOfPurgedUsers(tenantId: string, cutoff: Temporal.Instant) {
    return this.run(
      `DELETE FROM consents c USING users u
      WHERE c.tenant_id=$1 AND u.tenant_id=c.tenant_id AND u.id=c.user_id
        AND u.deleted_at<$2`,
      tenantId,
      cutoff,
    );
  }
  purgeDeletedUsers(tenantId: string, cutoff: Temporal.Instant) {
    return this.run(
      `DELETE FROM users u WHERE u.tenant_id=$1 AND u.deleted_at<$2
        AND NOT EXISTS (SELECT 1 FROM bookings b WHERE b.tenant_id=u.tenant_id AND b.user_id=u.id)
        AND NOT EXISTS (SELECT 1 FROM booking_blocks k WHERE k.tenant_id=u.tenant_id AND k.user_id=u.id)
        AND NOT EXISTS (SELECT 1 FROM notifications n WHERE n.tenant_id=u.tenant_id AND n.user_id=u.id)
        AND NOT EXISTS (SELECT 1 FROM sessions s WHERE s.tenant_id=u.tenant_id AND s.user_id=u.id)
        AND NOT EXISTS (SELECT 1 FROM audit_events a WHERE a.tenant_id=u.tenant_id AND a.actor_id=u.id)
        AND NOT EXISTS (SELECT 1 FROM consents c WHERE c.tenant_id=u.tenant_id AND c.user_id=u.id)
        AND NOT EXISTS (SELECT 1 FROM identities i WHERE i.tenant_id=u.tenant_id AND i.user_id=u.id)`,
      tenantId,
      cutoff,
    );
  }
}
