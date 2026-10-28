// SPDX-License-Identifier: AGPL-3.0-or-later
import { Injectable } from "@nestjs/common";
import { UserCategoryRepository } from "../../domain/user-category.repository";
import { Principal, can } from "../../../../shared/application/principal";
import { Result } from "../../../../shared/application/result";
import { failure } from "../../../../shared/application/errors";
/** Finds citizens by name so a manager can assign a category directly. */
@Injectable()
export class SearchCitizens {
  constructor(private readonly categories: UserCategoryRepository) {}
  async execute(args: { principal: Principal; query: string }) {
    if (!can(args.principal, "categories:manage"))
      return Result.err(failure("forbidden"));
    return Result.ok(
      await this.categories.searchCitizens(
        args.principal.tenantId,
        args.query.trim(),
        20,
      ),
    );
  }
}
