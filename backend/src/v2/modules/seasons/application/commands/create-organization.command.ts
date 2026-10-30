// SPDX-License-Identifier: AGPL-3.0-or-later
import { Injectable } from "@nestjs/common";
import { SeasonRepository } from "../../domain/season.repository";
import { OrganizationInput, cleanOrganization } from "../organization-input";
import { Principal, can } from "../../../../shared/application/principal";
import { Clock } from "../../../../shared/application/clock";
import { IdGenerator } from "../../../../shared/application/id-generator";
import { Audit } from "../../../../shared/application/audit";
import { Result } from "../../../../shared/application/result";
import { AppError, failure } from "../../../../shared/application/errors";
/** The manager registers a club, school or association (#17). */
@Injectable()
export class CreateOrganization {
  constructor(
    private readonly seasons: SeasonRepository,
    private readonly clock: Clock,
    private readonly ids: IdGenerator,
    private readonly audit: Audit,
  ) {}
  async execute(args: {
    principal: Principal;
    input: OrganizationInput;
  }): Promise<
    Result<{ id: string }, AppError<"forbidden"> | AppError<"validation">>
  > {
    if (!can(args.principal, "facilities:manage"))
      return Result.err(failure("forbidden"));
    const values = cleanOrganization(args.input);
    if (values.name.length < 2) return Result.err(failure("validation"));
    const id = this.ids.next();
    await this.seasons.saveOrganization({
      id,
      tenantId: args.principal.tenantId,
      ...values,
      createdAt: this.clock.now(),
      archivedAt: null,
    });
    await this.audit.record(args.principal, "organization.created", id, {
      name: values.name,
    });
    return Result.ok({ id });
  }
}
