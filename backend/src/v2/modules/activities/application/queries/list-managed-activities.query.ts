// SPDX-License-Identifier: AGPL-3.0-or-later
import { Injectable } from "@nestjs/common";
import { ActivityRepository } from "../../domain/activity.repository";
import { ManagedActivity } from "../../domain/activity.read-model";
import { Principal, can } from "../../../../shared/application/principal";
import { Clock } from "../../../../shared/application/clock";
import { Result } from "../../../../shared/application/result";
import { AppError, failure } from "../../../../shared/application/errors";
/** Every activity of the municipality, drafts and cancelled ones included (#97). */
@Injectable()
export class ListManagedActivities {
  constructor(
    private readonly activities: ActivityRepository,
    private readonly clock: Clock,
  ) {}
  async execute(args: {
    principal: Principal;
  }): Promise<Result<ManagedActivity[], AppError<"forbidden">>> {
    if (!can(args.principal, "facilities:manage"))
      return Result.err(failure("forbidden"));
    return Result.ok(
      await this.activities.list(args.principal.tenantId, this.clock.now()),
    );
  }
}
