// SPDX-License-Identifier: AGPL-3.0-or-later
import { Injectable } from "@nestjs/common";
import { MunicipalitySettingsRepository } from "../../domain/municipality-settings.repository";
import { Principal, can } from "../../../../shared/application/principal";
import { Audit } from "../../../../shared/application/audit";
import { Result } from "../../../../shared/application/result";
import { AppError, failure } from "../../../../shared/application/errors";
export type DeleteMunicipalityLogoError = AppError<"forbidden">;
@Injectable()
export class DeleteMunicipalityLogo {
  constructor(
    private readonly settings: MunicipalitySettingsRepository,
    private readonly audit: Audit,
  ) {}
  async execute(args: {
    principal: Principal;
  }): Promise<Result<void, DeleteMunicipalityLogoError>> {
    if (!can(args.principal, "municipality:manage"))
      return Result.err(failure("forbidden"));
    if (await this.settings.deleteLogo(args.principal.tenantId))
      await this.audit.record(
        args.principal,
        "municipality.logo_deleted",
        args.principal.tenantId,
      );
    return Result.ok();
  }
}
