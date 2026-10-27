// SPDX-License-Identifier: AGPL-3.0-or-later
import { Injectable } from "@nestjs/common";
import { AccountRepository } from "../../domain/account.repository";
import { UnsubscribeTokens } from "../../../../shared/application/unsubscribe-tokens";
import { Clock } from "../../../../shared/application/clock";
import { Audit } from "../../../../shared/application/audit";
import { Result } from "../../../../shared/application/result";
import { AppError, failure } from "../../../../shared/application/errors";
export type UnsubscribeError = AppError<"validation"> | AppError<"not_found">;
/** Switches reminders off from the signed link in an email, without signing in. Idempotent. */
@Injectable()
export class Unsubscribe {
  constructor(
    private readonly accounts: AccountRepository,
    private readonly tokens: UnsubscribeTokens,
    private readonly clock: Clock,
    private readonly audit: Audit,
  ) {}
  async execute(args: {
    token: string;
  }): Promise<Result<void, UnsubscribeError>> {
    const target = this.tokens.verify(args.token);
    if (!target) return Result.err(failure("validation"));
    const { tenantId, userId } = target;
    await this.accounts.lockUser(tenantId, userId);
    if (!(await this.accounts.find(tenantId, userId)))
      return Result.err(failure("not_found"));
    const current = await this.accounts.findPreferences(tenantId, userId);
    if (!current.reminderEmails) return Result.ok();
    await this.accounts.setReminderEmails(
      tenantId,
      userId,
      false,
      this.clock.now(),
    );
    await this.audit.recordSystem(
      tenantId,
      "notification_preferences.unsubscribed",
      userId,
      { kind: target.kind, channel: target.channel },
    );
    return Result.ok();
  }
}
