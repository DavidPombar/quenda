// SPDX-License-Identifier: AGPL-3.0-or-later
import { Injectable } from "@nestjs/common";
import { DependantRepository } from "../../domain/dependant.repository";
import type { Dependant } from "../../domain/dependant.entity";
import {
  GUARDIANSHIP_DECLARATION_VERSION,
  MAX_DEPENDANTS,
} from "../../domain/guardianship";
import { cleanDependantInput } from "../dependant-input";
import { Principal, can } from "../../../../shared/application/principal";
import { Municipalities } from "../../../../shared/application/municipality-settings";
import { Clock } from "../../../../shared/application/clock";
import { Audit } from "../../../../shared/application/audit";
import { Result } from "../../../../shared/application/result";
import { AppError, failure } from "../../../../shared/application/errors";
export type AddDependantError =
  | AppError<"forbidden">
  | AppError<"not_found">
  | AppError<"validation">
  | AppError<"declaration_required">
  | AppError<"dependant_limit">
  | AppError<"id_reused">;
/**
 * Adds a person in the adult's care (#97, part C). The adult declares, in the version of the
 * text they were shown, that they hold parental authority or guardianship; only a first name and
 * a year of birth are kept.
 */
@Injectable()
export class AddDependant {
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
    declared: boolean;
    declarationVersion: string;
  }): Promise<Result<Dependant, AddDependantError>> {
    if (!can(args.principal, "account:own"))
      return Result.err(failure("forbidden"));
    const { tenantId, userId } = args.principal;
    if (
      !args.declared ||
      args.declarationVersion !== GUARDIANSHIP_DECLARATION_VERSION
    )
      return Result.err(failure("declaration_required"));
    const municipality = await this.municipalities.find(tenantId);
    if (!municipality) return Result.err(failure("not_found"));
    const now = this.clock.now();
    const input = cleanDependantInput(
      args,
      now.toZonedDateTimeISO(municipality.timezone).year,
    );
    if (!input) return Result.err(failure("validation"));
    // Serialises additions by the same adult, so the limit holds.
    await this.dependants.lockUser(tenantId, userId);
    const repeated = await this.dependants.findById(tenantId, args.id);
    if (repeated)
      return repeated.userId === userId
        ? Result.ok(repeated)
        : Result.err(failure("id_reused"));
    const existing = await this.dependants.list(tenantId, userId);
    if (existing.length >= MAX_DEPENDANTS)
      return Result.err(failure("dependant_limit"));
    const dependant: Dependant = {
      id: args.id,
      tenantId,
      userId,
      ...input,
      declarationVersion: GUARDIANSHIP_DECLARATION_VERSION,
      declaredAt: now,
      createdAt: now,
    };
    await this.dependants.add(dependant);
    await this.audit.record(args.principal, "dependant.added", dependant.id, {
      declarationVersion: GUARDIANSHIP_DECLARATION_VERSION,
    });
    return Result.ok(dependant);
  }
}
