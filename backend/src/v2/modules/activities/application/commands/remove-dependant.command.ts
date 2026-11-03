// SPDX-License-Identifier: AGPL-3.0-or-later
import { Injectable } from "@nestjs/common";
import { DependantRepository } from "../../domain/dependant.repository";
import { Principal, can } from "../../../../shared/application/principal";
import { Audit } from "../../../../shared/application/audit";
import { Result } from "../../../../shared/application/result";
import { AppError, failure } from "../../../../shared/application/errors";
export type RemoveDependantError =
  AppError<"forbidden"> | AppError<"not_found"> | AppError<"dependant_in_use">;
/**
 * Removes a person from the adult's care (#97). While they hold or wait for a place the adult
 * leaves those activities first; past enrolments keep no name once the person is gone.
 */
@Injectable()
export class RemoveDependant {
  constructor(
    private readonly dependants: DependantRepository,
    private readonly audit: Audit,
  ) {}
  async execute(args: {
    principal: Principal;
    id: string;
  }): Promise<Result<void, RemoveDependantError>> {
    if (!can(args.principal, "account:own"))
      return Result.err(failure("forbidden"));
    const { tenantId, userId } = args.principal;
    await this.dependants.lockUser(tenantId, userId);
    const found = await this.dependants.find(tenantId, userId, args.id);
    if (!found) return Result.err(failure("not_found"));
    if (await this.dependants.hasOpenEnrolments(tenantId, found.id))
      return Result.err(failure("dependant_in_use"));
    await this.dependants.remove(tenantId, found.id);
    await this.audit.record(args.principal, "dependant.removed", found.id);
    return Result.ok();
  }
}
