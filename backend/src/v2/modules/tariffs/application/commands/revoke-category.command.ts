// SPDX-License-Identifier: AGPL-3.0-or-later
import { Injectable } from "@nestjs/common";
import { UserCategoryRepository } from "../../domain/user-category.repository";
import { Category } from "../../../../shared/application/categories";
import { Principal, can } from "../../../../shared/application/principal";
import { Audit } from "../../../../shared/application/audit";
import { Result } from "../../../../shared/application/result";
import { AppError, failure } from "../../../../shared/application/errors";
export type RevokeCategoryError = AppError<"forbidden"> | AppError<"not_found">;
/** Existing reservations keep the tariff they were made with. */
@Injectable()
export class RevokeCategory {
  constructor(
    private readonly categories: UserCategoryRepository,
    private readonly audit: Audit,
  ) {}
  async execute(args: {
    principal: Principal;
    userId: string;
    category: Category;
  }): Promise<Result<void, RevokeCategoryError>> {
    if (!can(args.principal, "categories:manage"))
      return Result.err(failure("forbidden"));
    const { tenantId } = args.principal;
    await this.categories.lockUser(tenantId, args.userId);
    if (!(await this.categories.findCitizen(tenantId, args.userId)))
      return Result.err(failure("not_found"));
    if (!(await this.categories.remove(tenantId, args.userId, args.category)))
      return Result.err(failure("not_found"));
    await this.audit.record(args.principal, "category.revoked", args.userId, {
      category: args.category,
    });
    return Result.ok();
  }
}
