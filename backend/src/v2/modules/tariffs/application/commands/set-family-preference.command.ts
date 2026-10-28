// SPDX-License-Identifier: AGPL-3.0-or-later
import { Injectable } from "@nestjs/common";
import { UserCategoryRepository } from "../../domain/user-category.repository";
import { Principal, can } from "../../../../shared/application/principal";
import { Result } from "../../../../shared/application/result";
import { AppError, failure } from "../../../../shared/application/errors";
export type SetFamilyPreferenceError =
  AppError<"forbidden"> | AppError<"not_found">;
/** Whether new reservations use the verified family tariff instead of the lowest one. */
@Injectable()
export class SetFamilyPreference {
  constructor(private readonly categories: UserCategoryRepository) {}
  async execute(args: {
    principal: Principal;
    prefersFamilyTariff: boolean;
  }): Promise<Result<void, SetFamilyPreferenceError>> {
    if (!can(args.principal, "account:own"))
      return Result.err(failure("forbidden"));
    const { tenantId, userId } = args.principal;
    if (!(await this.categories.findCitizen(tenantId, userId)))
      return Result.err(failure("not_found"));
    await this.categories.setPrefersFamily(
      tenantId,
      userId,
      args.prefersFamilyTariff,
    );
    return Result.ok();
  }
}
