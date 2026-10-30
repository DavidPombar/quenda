// SPDX-License-Identifier: AGPL-3.0-or-later
import { Injectable } from "@nestjs/common";
import { SeasonRepository } from "../../domain/season.repository";
import { Principal, can } from "../../../../shared/application/principal";
import { Audit } from "../../../../shared/application/audit";
import { Result } from "../../../../shared/application/result";
import { AppError, failure } from "../../../../shared/application/errors";
@Injectable()
export class RemoveRepresentative {
  constructor(
    private readonly seasons: SeasonRepository,
    private readonly audit: Audit,
  ) {}
  async execute(args: {
    principal: Principal;
    organizationId: string;
    userId: string;
  }): Promise<Result<void, AppError<"forbidden"> | AppError<"not_found">>> {
    if (!can(args.principal, "facilities:manage"))
      return Result.err(failure("forbidden"));
    const removed = await this.seasons.removeRepresentative(
      args.principal.tenantId,
      args.organizationId,
      args.userId,
    );
    if (!removed) return Result.err(failure("not_found"));
    await this.audit.record(
      args.principal,
      "organization.representative_removed",
      args.organizationId,
      { userId: args.userId },
    );
    return Result.ok();
  }
}
