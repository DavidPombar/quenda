// SPDX-License-Identifier: AGPL-3.0-or-later
import { Injectable } from "@nestjs/common";
import { DependantRepository } from "../../domain/dependant.repository";
import type { Dependant } from "../../domain/dependant.entity";
import { cleanDependantInput } from "../dependant-input";
import { Principal, can } from "../../../../shared/application/principal";
import { Municipalities } from "../../../../shared/application/municipality-settings";
import { Clock } from "../../../../shared/application/clock";
import { Audit } from "../../../../shared/application/audit";
import { Result } from "../../../../shared/application/result";
import { AppError, failure } from "../../../../shared/application/errors";
export type UpdateDependantError =
  AppError<"forbidden"> | AppError<"not_found"> | AppError<"validation">;
/** Corrects the first name or year of birth of a person in the adult's care (#97). */
@Injectable()
export class UpdateDependant {
  constructor(
    private readonly dependants: DependantRepository,
    private readonly municipalities: Municipalities,
    private readonly clock: Clock,
    private readonly audit: Audit,
  ) {}
  async execute(args: {
    principal: Principal;
    id: string;
    firstName: string;
    birthYear: number;
  }): Promise<Result<Dependant, UpdateDependantError>> {
    if (!can(args.principal, "account:own"))
      return Result.err(failure("forbidden"));
    const { tenantId, userId } = args.principal;
    const municipality = await this.municipalities.find(tenantId);
    const found = await this.dependants.find(tenantId, userId, args.id);
    if (!municipality || !found) return Result.err(failure("not_found"));
    const input = cleanDependantInput(
      args,
      this.clock.now().toZonedDateTimeISO(municipality.timezone).year,
    );
    if (!input) return Result.err(failure("validation"));
    const saved = { ...found, ...input };
    await this.dependants.save(saved);
    await this.audit.record(args.principal, "dependant.updated", found.id);
    return Result.ok(saved);
  }
}
