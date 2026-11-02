// SPDX-License-Identifier: AGPL-3.0-or-later
import { Injectable } from "@nestjs/common";
import { ActivityRepository } from "../../domain/activity.repository";
import { ManagedActivityDetails } from "../../domain/activity.read-model";
import { Principal, can } from "../../../../shared/application/principal";
import { Clock } from "../../../../shared/application/clock";
import { Result } from "../../../../shared/application/result";
import { AppError, failure } from "../../../../shared/application/errors";
/** One activity with its dated sessions, for the backoffice (#97). */
@Injectable()
export class GetManagedActivity {
  constructor(
    private readonly activities: ActivityRepository,
    private readonly clock: Clock,
  ) {}
  async execute(args: {
    principal: Principal;
    id: string;
  }): Promise<
    Result<ManagedActivityDetails, AppError<"forbidden"> | AppError<"not_found">>
  > {
    if (!can(args.principal, "facilities:manage"))
      return Result.err(failure("forbidden"));
    const details = await this.activities.details(
      args.principal.tenantId,
      args.id,
      this.clock.now(),
    );
    return details ? Result.ok(details) : Result.err(failure("not_found"));
  }
}
