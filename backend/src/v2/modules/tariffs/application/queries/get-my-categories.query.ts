// SPDX-License-Identifier: AGPL-3.0-or-later
import { Injectable } from "@nestjs/common";
import { UserCategoryRepository } from "../../domain/user-category.repository";
import { UserCategory } from "../../domain/user-category.entity";
import { Principal, can } from "../../../../shared/application/principal";
import { Result } from "../../../../shared/application/result";
import { AppError, failure } from "../../../../shared/application/errors";
export type GetMyCategoriesError =
  AppError<"forbidden"> | AppError<"not_found">;
@Injectable()
export class GetMyCategories {
  constructor(private readonly categories: UserCategoryRepository) {}
  async execute(args: {
    principal: Principal;
  }): Promise<
    Result<
      { categories: UserCategory[]; prefersFamilyTariff: boolean },
      GetMyCategoriesError
    >
  > {
    if (!can(args.principal, "account:own"))
      return Result.err(failure("forbidden"));
    const { tenantId, userId } = args.principal;
    const citizen = await this.categories.findCitizen(tenantId, userId);
    if (!citizen) return Result.err(failure("not_found"));
    return Result.ok({
      categories: citizen.categories,
      prefersFamilyTariff: await this.categories.prefersFamily(
        tenantId,
        userId,
      ),
    });
  }
}
