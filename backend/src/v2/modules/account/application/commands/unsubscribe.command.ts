// SPDX-License-Identifier: AGPL-3.0-or-later
import { Injectable } from "@nestjs/common";
import { AccountRepository } from "../../domain/account.repository";
import { UnsubscribeTokens } from "../../../../shared/application/unsubscribe-tokens";
import { NoticeKind } from "../../../../shared/application/notice-preferences";
import { Clock } from "../../../../shared/application/clock";
import { Audit } from "../../../../shared/application/audit";
import { Result } from "../../../../shared/application/result";
import { AppError, failure } from "../../../../shared/application/errors";
export type UnsubscribeError =
  | AppError<"validation">
  | AppError<"not_found">
  | AppError<"unsubscribe_stale">;
/**
 * Switches one notice off by email from the signed link in a message, without signing in.
 * Repeating it does nothing; once the person changes that choice again, the link stops working.
 */
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
  }): Promise<Result<{ kind: NoticeKind }, UnsubscribeError>> {
    const target = this.tokens.verify(args.token);
    if (!target) return Result.err(failure("validation"));
    const { tenantId, userId, kind } = target;
    await this.accounts.lockUser(tenantId, userId);
    if (!(await this.accounts.find(tenantId, userId)))
      return Result.err(failure("not_found"));
    const current = await this.accounts.findPreferences(tenantId, userId);
    if (!current[kind].email) return Result.ok({ kind });
    if (
      target.version !== null &&
      target.version !==
        (await this.accounts.preferenceVersion(tenantId, userId, kind, "email"))
    )
      return Result.err(failure("unsubscribe_stale"));
    await this.accounts.setPreference(
      tenantId,
      userId,
      { kind, channel: "email", enabled: false },
      this.clock.now(),
    );
    await this.audit.recordSystem(
      tenantId,
      "notification_preferences.unsubscribed",
      userId,
      { kind, channel: "email" },
    );
    return Result.ok({ kind });
  }
}
