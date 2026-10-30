// SPDX-License-Identifier: AGPL-3.0-or-later
import { Injectable } from "@nestjs/common";
import { SeasonRepository } from "../../domain/season.repository";
import { Principal, can } from "../../../../shared/application/principal";
import { Audit } from "../../../../shared/application/audit";
import { Result } from "../../../../shared/application/result";
import { AppError, failure } from "../../../../shared/application/errors";
export type AddRepresentativeError =
  AppError<"forbidden"> | AppError<"not_found"> | AppError<"validation">;
/**
 * Links an existing citizen account of the municipality to a club. A person represents a single
 * club, so someone already linked elsewhere must be removed there first.
 */
@Injectable()
export class AddRepresentative {
  constructor(
    private readonly seasons: SeasonRepository,
    private readonly audit: Audit,
  ) {}
  async execute(args: {
    principal: Principal;
    organizationId: string;
    email: string;
  }): Promise<Result<{ userId: string }, AddRepresentativeError>> {
    if (!can(args.principal, "facilities:manage"))
      return Result.err(failure("forbidden"));
    const { tenantId } = args.principal;
    const organization = await this.seasons.findOrganization(
      tenantId,
      args.organizationId,
    );
    if (!organization) return Result.err(failure("not_found"));
    const person = await this.seasons.findCitizenByEmail(
      tenantId,
      args.email.trim(),
    );
    if (!person) return Result.err(failure("not_found"));
    if (person.organizationId === organization.id)
      return Result.ok({ userId: person.userId });
    if (person.organizationId !== null)
      return Result.err(failure("validation"));
    await this.seasons.setRepresentative(
      tenantId,
      person.userId,
      organization.id,
    );
    await this.audit.record(
      args.principal,
      "organization.representative_added",
      organization.id,
      { userId: person.userId },
    );
    return Result.ok({ userId: person.userId });
  }
}
