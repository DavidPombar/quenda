// SPDX-License-Identifier: AGPL-3.0-or-later
import { Injectable } from "@nestjs/common";
import { AccountRepository } from "../../domain/account.repository";
import { Principal, can } from "../../../../shared/application/principal";
import { Clock } from "../../../../shared/application/clock";
import { Audit } from "../../../../shared/application/audit";
import { Result } from "../../../../shared/application/result";
import { AppError, failure } from "../../../../shared/application/errors";
import {
  NoticePreferences,
  noticeChannels,
  noticeKinds,
} from "../../../../shared/application/notice-preferences";
export type UpdateNotificationPreferencesError =
  AppError<"forbidden"> | AppError<"not_found">;
/**
 * Stores the person's choice for every notice and channel. Only the choices that change are
 * written and audited, so an unchanged choice keeps the version its unsubscribe links carry.
 */
@Injectable()
export class UpdateNotificationPreferences {
  constructor(
    private readonly accounts: AccountRepository,
    private readonly clock: Clock,
    private readonly audit: Audit,
  ) {}
  async execute(args: {
    principal: Principal;
    preferences: NoticePreferences;
  }): Promise<Result<void, UpdateNotificationPreferencesError>> {
    if (!can(args.principal, "account:own"))
      return Result.err(failure("forbidden"));
    const { tenantId, userId } = args.principal;
    await this.accounts.lockUser(tenantId, userId);
    if (!(await this.accounts.find(tenantId, userId)))
      return Result.err(failure("not_found"));
    const current = await this.accounts.findPreferences(tenantId, userId);
    const now = this.clock.now();
    const changed: Record<string, boolean> = {};
    for (const kind of noticeKinds)
      for (const channel of noticeChannels) {
        const enabled = args.preferences[kind][channel];
        if (current[kind][channel] === enabled) continue;
        await this.accounts.setPreference(
          tenantId,
          userId,
          { kind, channel, enabled },
          now,
        );
        changed[`${kind}.${channel}`] = enabled;
      }
    if (Object.keys(changed).length)
      await this.audit.record(
        args.principal,
        "notification_preferences.updated",
        userId,
        changed,
      );
    return Result.ok();
  }
}
