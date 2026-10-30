// SPDX-License-Identifier: AGPL-3.0-or-later
import { Injectable } from "@nestjs/common";
import { SeasonRepository } from "../../domain/season.repository";
import { Organization } from "../../domain/season.read-model";
import { Principal, can } from "../../../../shared/application/principal";
import { Result } from "../../../../shared/application/result";
import { AppError, failure } from "../../../../shared/application/errors";
@Injectable()
export class ListOrganizations {
  constructor(private readonly seasons: SeasonRepository) {}
  async execute(args: {
    principal: Principal;
  }): Promise<Result<Organization[], AppError<"forbidden">>> {
    if (!can(args.principal, "facilities:manage"))
      return Result.err(failure("forbidden"));
    return Result.ok(
      await this.seasons.listOrganizations(args.principal.tenantId),
    );
  }
}
