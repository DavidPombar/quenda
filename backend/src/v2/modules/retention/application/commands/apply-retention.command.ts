// SPDX-License-Identifier: AGPL-3.0-or-later
import { Injectable } from "@nestjs/common";
import type { Temporal } from "@js-temporal/polyfill";
import { RetentionRepository } from "../../domain/retention.repository";
import { Municipalities } from "../../../../shared/application/municipality-settings";
import { Clock } from "../../../../shared/application/clock";
import { Audit } from "../../../../shared/application/audit";
import { Result } from "../../../../shared/application/result";
import { AppError, failure } from "../../../../shared/application/errors";
export interface RetentionSummary {
  tenantId: string;
  cutoff: Temporal.Instant;
  bookingsDetached: number;
  notificationsDeleted: number;
  blocksDeleted: number;
  auditPseudonymised: number;
  sessionsPurged: number;
  loginAttemptsPurged: number;
  consentsDeleted: number;
  usersPurged: number;
}
/** Applies the municipality retention policy. Invoked by the operations CLI, not over HTTP. */
@Injectable()
export class ApplyRetention {
  constructor(
    private readonly retention: RetentionRepository,
    private readonly municipalities: Municipalities,
    private readonly clock: Clock,
    private readonly audit: Audit,
  ) {}
  async execute(args: {
    tenantId: string;
  }): Promise<Result<RetentionSummary, AppError<"not_found">>> {
    const settings = await this.municipalities.find(args.tenantId);
    if (!settings) return Result.err(failure("not_found"));
    const now = this.clock.now();
    const cutoff = now
      .toZonedDateTimeISO(settings.timezone)
      .subtract({ months: settings.retentionMonths })
      .toInstant();
    const tenantId = settings.id;
    const bookingsDetached = await this.retention.detachBookings(
      tenantId,
      cutoff,
    );
    const notificationsDeleted = await this.retention.deleteNotifications(
      tenantId,
      cutoff,
    );
    const blocksDeleted = await this.retention.deleteBlocks(tenantId, cutoff);
    const auditPseudonymised = await this.retention.pseudonymiseAudit(
      tenantId,
      cutoff,
    );
    const sessionsPurged = await this.retention.purgeSessions(tenantId, now);
    const loginAttemptsPurged = await this.retention.purgeLoginAttempts(
      tenantId,
      now,
    );
    const consentsDeleted = await this.retention.deleteConsentsOfPurgedUsers(
      tenantId,
      cutoff,
    );
    const usersPurged = await this.retention.purgeDeletedUsers(
      tenantId,
      cutoff,
    );
    const summary: RetentionSummary = {
      tenantId,
      cutoff,
      bookingsDetached,
      notificationsDeleted,
      blocksDeleted,
      auditPseudonymised,
      sessionsPurged,
      loginAttemptsPurged,
      consentsDeleted,
      usersPurged,
    };
    await this.audit.recordSystem(tenantId, "retention.applied", tenantId, {
      cutoff: cutoff.toString(),
      bookingsDetached,
      notificationsDeleted,
      blocksDeleted,
      auditPseudonymised,
      sessionsPurged,
      loginAttemptsPurged,
      consentsDeleted,
      usersPurged,
    });
    return Result.ok(summary);
  }
}
