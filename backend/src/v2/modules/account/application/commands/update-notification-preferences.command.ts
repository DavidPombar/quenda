// SPDX-License-Identifier: AGPL-3.0-or-later
import { Injectable } from "@nestjs/common";
import { AccountRepository } from "../../domain/account.repository";
import { Principal, can } from "../../../../shared/application/principal";
import { Clock } from "../../../../shared/application/clock";
import { Audit } from "../../../../shared/application/audit";
import { Result } from "../../../../shared/application/result";
import { AppError, failure } from "../../../../shared/application/errors";
export type UpdateNotificationPreferencesError =
  AppError<"forbidden"> | AppError<"not_found">;
/** Confirmations, changes and cancellations are part of the service; only reminders are optional. */
@Injectable()
export class UpdateNotificationPreferences {
  constructor(
    private readonly accounts: AccountRepository,
    private readonly clock: Clock,
    private readonly audit: Audit,
  ) {}
  async execute(args: {
    principal: Principal;
    reminderEmails: boolean;
  }): Promise<Result<void, UpdateNotificationPreferencesError>> {
    if (!can(args.principal, "account:own"))
      return Result.err(failure("forbidden"));
    const { tenantId, userId } = args.principal;
    await this.accounts.lockUser(tenantId, userId);
    if (!(await this.accounts.find(tenantId, userId)))
      return Result.err(failure("not_found"));
    const current = await this.accounts.findPreferences(tenantId, userId);
    if (current.reminderEmails === args.reminderEmails) return Result.ok();
    await this.accounts.setReminderEmails(
      tenantId,
      userId,
      args.reminderEmails,
      this.clock.now(),
    );
    await this.audit.record(
      args.principal,
      "notification_preferences.updated",
      userId,
      { reminderEmails: args.reminderEmails },
    );
    return Result.ok();
  }
}
