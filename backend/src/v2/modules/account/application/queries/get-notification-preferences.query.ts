// SPDX-License-Identifier: AGPL-3.0-or-later
import { Injectable } from "@nestjs/common";
import { AccountRepository } from "../../domain/account.repository";
import { NotificationSettings } from "../../domain/account.read-model";
import { Principal, can } from "../../../../shared/application/principal";
import { PushSender } from "../../../../shared/application/push-sender";
import { Result } from "../../../../shared/application/result";
import { AppError, failure } from "../../../../shared/application/errors";
export type GetNotificationPreferencesError =
  AppError<"forbidden"> | AppError<"not_found">;
@Injectable()
export class GetNotificationPreferences {
  constructor(
    private readonly accounts: AccountRepository,
    private readonly push: PushSender,
  ) {}
  async execute(args: {
    principal: Principal;
  }): Promise<Result<NotificationSettings, GetNotificationPreferencesError>> {
    if (!can(args.principal, "account:own"))
      return Result.err(failure("forbidden"));
    const { tenantId, userId } = args.principal;
    if (!(await this.accounts.find(tenantId, userId)))
      return Result.err(failure("not_found"));
    const publicKey = this.push.publicKey();
    return Result.ok({
      preferences: await this.accounts.findPreferences(tenantId, userId),
      push: {
        available: publicKey !== null,
        publicKey,
        devices: await this.accounts.countPushDevices(tenantId, userId),
      },
    });
  }
}
