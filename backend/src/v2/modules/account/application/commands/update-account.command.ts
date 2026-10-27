// SPDX-License-Identifier: AGPL-3.0-or-later
import { Injectable } from "@nestjs/common";
import { AccountRepository } from "../../domain/account.repository";
import { Principal, can } from "../../../../shared/application/principal";
import { Result } from "../../../../shared/application/result";
import { AppError, failure } from "../../../../shared/application/errors";
export type UpdateAccountError = AppError<"forbidden"> | AppError<"not_found">;
/** Remembers the language the person uses so messages reach them in it. */
@Injectable()
export class UpdateAccount {
  constructor(private readonly accounts: AccountRepository) {}
  async execute(args: {
    principal: Principal;
    locale: "gl" | "es";
  }): Promise<Result<void, UpdateAccountError>> {
    if (!can(args.principal, "account:own"))
      return Result.err(failure("forbidden"));
    const { tenantId, userId } = args.principal;
    const profile = await this.accounts.find(tenantId, userId);
    if (!profile) return Result.err(failure("not_found"));
    if (profile.locale !== args.locale)
      await this.accounts.setLocale(tenantId, userId, args.locale);
    return Result.ok();
  }
}
