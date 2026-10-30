// SPDX-License-Identifier: AGPL-3.0-or-later
import { Injectable } from "@nestjs/common";
import { SeasonRepository } from "../../domain/season.repository";
import { OrganizationInput, cleanOrganization } from "../organization-input";
import { Principal, can } from "../../../../shared/application/principal";
import { Clock } from "../../../../shared/application/clock";
import { Audit } from "../../../../shared/application/audit";
import { Result } from "../../../../shared/application/result";
import { AppError, failure } from "../../../../shared/application/errors";
export type UpdateOrganizationError =
  AppError<"forbidden"> | AppError<"not_found"> | AppError<"validation">;
/** Edits a club's details or archives it; archived clubs get no new slots. */
@Injectable()
export class UpdateOrganization {
  constructor(
    private readonly seasons: SeasonRepository,
    private readonly clock: Clock,
    private readonly audit: Audit,
  ) {}
  async execute(args: {
    principal: Principal;
    id: string;
    input: OrganizationInput & { archived?: boolean };
  }): Promise<Result<void, UpdateOrganizationError>> {
    if (!can(args.principal, "facilities:manage"))
      return Result.err(failure("forbidden"));
    const existing = await this.seasons.findOrganization(
      args.principal.tenantId,
      args.id,
    );
    if (!existing) return Result.err(failure("not_found"));
    const values = cleanOrganization(args.input);
    if (values.name.length < 2) return Result.err(failure("validation"));
    const archivedAt =
      args.input.archived === undefined
        ? existing.archivedAt
        : args.input.archived
          ? (existing.archivedAt ?? this.clock.now())
          : null;
    await this.seasons.saveOrganization({ ...existing, ...values, archivedAt });
    await this.audit.record(args.principal, "organization.updated", args.id, {
      name: values.name,
      archived: archivedAt !== null,
    });
    return Result.ok();
  }
}
