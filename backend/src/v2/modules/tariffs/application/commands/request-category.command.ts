// SPDX-License-Identifier: AGPL-3.0-or-later
import { Injectable } from "@nestjs/common";
import { UserCategoryRepository } from "../../domain/user-category.repository";
import { UserCategory } from "../../domain/user-category.entity";
import { Category } from "../../../../shared/application/categories";
import { Municipalities } from "../../../../shared/application/municipality-settings";
import { Principal, can } from "../../../../shared/application/principal";
import { Clock } from "../../../../shared/application/clock";
import { Audit } from "../../../../shared/application/audit";
import { Result } from "../../../../shared/application/result";
import { AppError, failure } from "../../../../shared/application/errors";
export type RequestCategoryError =
  | AppError<"forbidden">
  | AppError<"not_found">
  | AppError<"category_not_enabled">
  | AppError<"category_already_requested">;
/** A person asks for a category; it applies once a manager verifies it. Rejected ones can be asked again. */
@Injectable()
export class RequestCategory {
  constructor(
    private readonly categories: UserCategoryRepository,
    private readonly municipalities: Municipalities,
    private readonly clock: Clock,
    private readonly audit: Audit,
  ) {}
  async execute(args: {
    principal: Principal;
    category: Category;
  }): Promise<Result<UserCategory, RequestCategoryError>> {
    if (!can(args.principal, "account:own"))
      return Result.err(failure("forbidden"));
    const { tenantId, userId } = args.principal;
    await this.categories.lockUser(tenantId, userId);
    const settings = await this.municipalities.find(tenantId);
    const citizen = await this.categories.findCitizen(tenantId, userId);
    if (!settings || !citizen) return Result.err(failure("not_found"));
    if (!settings.enabledCategories.includes(args.category))
      return Result.err(failure("category_not_enabled"));
    const existing = citizen.categories.find(
      (entry) => entry.category === args.category,
    );
    if (existing && existing.status !== "rejected")
      return Result.err(failure("category_already_requested"));
    const entry: UserCategory = {
      category: args.category,
      status: "requested",
      requestedAt: this.clock.now(),
      decidedAt: null,
    };
    await this.categories.save(tenantId, userId, entry);
    await this.audit.record(args.principal, "category.requested", userId, {
      category: args.category,
    });
    return Result.ok(entry);
  }
}
