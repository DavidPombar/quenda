// SPDX-License-Identifier: AGPL-3.0-or-later
import { Injectable } from "@nestjs/common";
import { SportRepository } from "../../domain/sport.repository";
import { Sport } from "../../domain/sport.entity";
import { Principal, can } from "../../../../shared/application/principal";
import { Result } from "../../../../shared/application/result";
import { AppError, failure } from "../../../../shared/application/errors";
/** The manager's whole sports catalogue, hidden sports included. */
@Injectable()
export class ListManagedSports {
  constructor(private readonly sports: SportRepository) {}
  async execute(args: {
    principal: Principal;
  }): Promise<Result<Sport[], AppError<"forbidden">>> {
    if (!can(args.principal, "facilities:manage"))
      return Result.err(failure("forbidden"));
    return Result.ok(await this.sports.list(args.principal.tenantId, true));
  }
}
