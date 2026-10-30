// SPDX-License-Identifier: AGPL-3.0-or-later
import { Injectable } from "@nestjs/common";
import { SportRepository } from "../../domain/sport.repository";
import { Principal, can } from "../../../../shared/application/principal";
import { Audit } from "../../../../shared/application/audit";
import { Result } from "../../../../shared/application/result";
import { AppError, failure } from "../../../../shared/application/errors";
export type RemoveSportError =
  AppError<"forbidden"> | AppError<"not_found"> | AppError<"sport_in_use">;
/** Removes a sport nobody uses (#26); one used by a facility or a club can only be hidden. */
@Injectable()
export class RemoveSport {
  constructor(
    private readonly sports: SportRepository,
    private readonly audit: Audit,
  ) {}
  async execute(args: {
    principal: Principal;
    code: string;
  }): Promise<Result<void, RemoveSportError>> {
    if (!can(args.principal, "facilities:manage"))
      return Result.err(failure("forbidden"));
    const tenantId = args.principal.tenantId;
    const sport = await this.sports.find(tenantId, args.code);
    if (!sport) return Result.err(failure("not_found"));
    if (await this.sports.inUse(tenantId, sport.code))
      return Result.err(failure("sport_in_use"));
    await this.sports.remove(tenantId, sport.code);
    await this.audit.record(args.principal, "sport.removed", tenantId, {
      code: sport.code,
      name: sport.name.gl,
    });
    return Result.ok();
  }
}
