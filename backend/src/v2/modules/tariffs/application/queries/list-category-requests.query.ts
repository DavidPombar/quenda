// SPDX-License-Identifier: AGPL-3.0-or-later
import { Injectable } from "@nestjs/common";
import { UserCategoryRepository } from "../../domain/user-category.repository";
import { Principal, can } from "../../../../shared/application/principal";
import { Result } from "../../../../shared/application/result";
import { failure } from "../../../../shared/application/errors";
@Injectable()
export class ListCategoryRequests {
  constructor(private readonly categories: UserCategoryRepository) {}
  async execute(args: { principal: Principal }) {
    if (!can(args.principal, "categories:manage"))
      return Result.err(failure("forbidden"));
    return Result.ok(
      await this.categories.listPending(args.principal.tenantId),
    );
  }
}
