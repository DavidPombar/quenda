// SPDX-License-Identifier: AGPL-3.0-or-later
import { Injectable } from "@nestjs/common";
import { DependantRepository } from "../../domain/dependant.repository";
import type { Dependant } from "../../domain/dependant.entity";
import { Principal, can } from "../../../../shared/application/principal";
import { Result } from "../../../../shared/application/result";
import { AppError, failure } from "../../../../shared/application/errors";
/** The people in the adult's care (#97). */
@Injectable()
export class ListDependants {
  constructor(private readonly dependants: DependantRepository) {}
  async execute(args: {
    principal: Principal;
  }): Promise<Result<Dependant[], AppError<"forbidden">>> {
    if (!can(args.principal, "account:own"))
      return Result.err(failure("forbidden"));
    return Result.ok(
      await this.dependants.list(
        args.principal.tenantId,
        args.principal.userId,
      ),
    );
  }
}
