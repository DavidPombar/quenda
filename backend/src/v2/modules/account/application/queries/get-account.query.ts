// SPDX-License-Identifier: AGPL-3.0-or-later
import { Injectable } from "@nestjs/common";
import { AccountRepository } from "../../domain/account.repository";
import { ConsentRepository } from "../../domain/consent.repository";
import { AccountSummary } from "../../domain/account.read-model";
import { Principal, can } from "../../../../shared/application/principal";
import { Municipalities } from "../../../../shared/application/municipality-settings";
import { Result } from "../../../../shared/application/result";
import { AppError, failure } from "../../../../shared/application/errors";
export type GetAccountError = AppError<"forbidden"> | AppError<"not_found">;
@Injectable()
export class GetAccount {
  constructor(
    private readonly accounts: AccountRepository,
    private readonly consents: ConsentRepository,
    private readonly municipalities: Municipalities,
  ) {}
  async execute(args: {
    principal: Principal;
  }): Promise<Result<AccountSummary, GetAccountError>> {
    if (!can(args.principal, "account:own"))
      return Result.err(failure("forbidden"));
    const { tenantId, userId } = args.principal;
    const settings = await this.municipalities.find(tenantId);
    const profile = await this.accounts.find(tenantId, userId);
    if (!settings || !profile) return Result.err(failure("not_found"));
    const consents = await this.consents.listByUser(tenantId, userId);
    const activity = await this.accounts.countActivity(tenantId, userId);
    return Result.ok({
      profile,
      currentLegalVersion: settings.legalVersion,
      consentUpToDate: consents[0]?.legalVersion === settings.legalVersion,
      consents,
      bookings: activity.bookings,
      notifications: activity.notifications,
      preferences: await this.accounts.findPreferences(tenantId, userId),
    });
  }
}
