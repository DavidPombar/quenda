// SPDX-License-Identifier: AGPL-3.0-or-later
import { Injectable } from "@nestjs/common";
import { SeasonRepository } from "../../domain/season.repository";
import { Allocation } from "../../domain/season.read-model";
import { Principal, can } from "../../../../shared/application/principal";
import { Result } from "../../../../shared/application/result";
import { AppError, failure } from "../../../../shared/application/errors";
@Injectable()
export class ListSeasonAllocations {
  constructor(private readonly seasons: SeasonRepository) {}
  async execute(args: {
    principal: Principal;
    campaignId: string;
  }): Promise<
    Result<Allocation[], AppError<"forbidden"> | AppError<"not_found">>
  > {
    if (!can(args.principal, "facilities:manage"))
      return Result.err(failure("forbidden"));
    const { tenantId } = args.principal;
    if (!(await this.seasons.findCampaign(tenantId, args.campaignId)))
      return Result.err(failure("not_found"));
    return Result.ok(
      await this.seasons.listAllocations(tenantId, args.campaignId),
    );
  }
}
