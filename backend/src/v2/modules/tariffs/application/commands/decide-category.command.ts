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
export type DecideCategoryError =
  | AppError<"forbidden">
  | AppError<"not_found">
  | AppError<"category_not_enabled">;
/**
 * A manager verifies or rejects a request, or assigns a category nobody asked for. Verification
 * happens outside the platform (V1: manual; pasaXe! later) and does not expire.
 */
@Injectable()
export class DecideCategory {
  constructor(
    private readonly categories: UserCategoryRepository,
    private readonly municipalities: Municipalities,
    private readonly clock: Clock,
    private readonly audit: Audit,
  ) {}
  async execute(args: {
    principal: Principal;
    userId: string;
    category: Category;
    status: "verified" | "rejected";
  }): Promise<Result<UserCategory, DecideCategoryError>> {
    if (!can(args.principal, "categories:manage"))
      return Result.err(failure("forbidden"));
    const { tenantId } = args.principal;
    await this.categories.lockUser(tenantId, args.userId);
    const settings = await this.municipalities.find(tenantId);
    const citizen = await this.categories.findCitizen(tenantId, args.userId);
    if (!settings || !citizen) return Result.err(failure("not_found"));
    if (!settings.enabledCategories.includes(args.category))
      return Result.err(failure("category_not_enabled"));
    const existing = citizen.categories.find(
      (entry) => entry.category === args.category,
    );
    if (existing?.status === args.status) return Result.ok(existing);
    if (!existing && args.status === "rejected")
      return Result.err(failure("not_found"));
    const entry: UserCategory = {
      category: args.category,
      status: args.status,
      requestedAt: existing?.requestedAt ?? null,
      decidedAt: this.clock.now(),
    };
    await this.categories.save(tenantId, args.userId, entry);
    await this.audit.record(
      args.principal,
      existing ? `category.${args.status}` : "category.assigned",
      args.userId,
      { category: args.category, before: existing?.status ?? null },
    );
    return Result.ok(entry);
  }
}
