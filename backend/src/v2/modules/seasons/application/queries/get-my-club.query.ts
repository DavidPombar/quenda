// SPDX-License-Identifier: AGPL-3.0-or-later
import { Injectable } from "@nestjs/common";
import { SeasonRepository } from "../../domain/season.repository";
import { MyClub } from "../../domain/season.read-model";
import { Principal, can } from "../../../../shared/application/principal";
import { Clock } from "../../../../shared/application/clock";
import { Result } from "../../../../shared/application/result";
import { AppError, failure } from "../../../../shared/application/errors";
/** The club a person represents and its upcoming season slots. */
@Injectable()
export class GetMyClub {
  constructor(
    private readonly seasons: SeasonRepository,
    private readonly clock: Clock,
  ) {}
  async execute(args: {
    principal: Principal;
  }): Promise<Result<MyClub, AppError<"forbidden">>> {
    if (!can(args.principal, "account:own"))
      return Result.err(failure("forbidden"));
    const { tenantId, userId } = args.principal;
    const organization = await this.seasons.clubOf(tenantId, userId);
    return Result.ok({
      organization,
      occurrences: organization
        ? await this.seasons.upcomingOccurrences(
            tenantId,
            organization.id,
            this.clock.now(),
          )
        : [],
    });
  }
}
