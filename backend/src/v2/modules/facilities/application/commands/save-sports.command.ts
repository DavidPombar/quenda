// SPDX-License-Identifier: AGPL-3.0-or-later
import { Injectable } from "@nestjs/common";
import { SportRepository } from "../../domain/sport.repository";
import { Sport } from "../../domain/sport.entity";
import { SportDraft, planSports } from "../../domain/sport-plan";
import { Principal, can } from "../../../../shared/application/principal";
import { Audit } from "../../../../shared/application/audit";
import { Result } from "../../../../shared/application/result";
import { AppError, failure } from "../../../../shared/application/errors";
export type SaveSportsError =
  | AppError<"forbidden">
  | AppError<"not_found">
  | AppError<"validation">
  | AppError<"sport_in_use">;
const audited = (sport: Sport) => ({
  code: sport.code,
  nameGl: sport.nameGl,
  nameEs: sport.nameEs,
  visible: sport.visible,
});
/** Replaces the municipality's sports catalogue (#26). */
@Injectable()
export class SaveSports {
  constructor(
    private readonly sports: SportRepository,
    private readonly audit: Audit,
  ) {}
  async execute(args: {
    principal: Principal;
    sports: SportDraft[];
  }): Promise<Result<Sport[], SaveSportsError>> {
    if (!can(args.principal, "facilities:manage"))
      return Result.err(failure("forbidden"));
    const { tenantId } = args.principal;
    // Serialises catalogue changes of the municipality, so a sport is not removed twice.
    if (!(await this.sports.lock(tenantId)))
      return Result.err(failure("not_found"));
    const current = await this.sports.list(tenantId, true);
    const result = planSports(
      current,
      args.sports,
      await this.sports.usedCodes(tenantId),
    );
    if ("error" in result) return Result.err(failure(result.error.code));
    // A facility created meanwhile with a removed sport makes the store refuse the removal.
    const applied = await this.sports.apply(tenantId, result.plan);
    if (applied.isFailure)
      return applied.fold<Result<Sport[], SaveSportsError>>(
        () => Result.ok([]),
        (error) => Result.err(error),
      );
    const saved = await this.sports.list(tenantId, true);
    await this.audit.record(
      args.principal,
      "municipality.sports_updated",
      tenantId,
      {
        before: current.map(audited),
        after: saved.map(audited),
      },
    );
    return Result.ok(saved);
  }
}
