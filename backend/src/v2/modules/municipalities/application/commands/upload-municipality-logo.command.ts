// SPDX-License-Identifier: AGPL-3.0-or-later
import { Injectable } from "@nestjs/common";
import { MunicipalitySettingsRepository } from "../../domain/municipality-settings.repository";
import { MAX_LOGO_BYTES, detectLogoType } from "../../domain/logo";
import { Principal, can } from "../../../../shared/application/principal";
import { Clock } from "../../../../shared/application/clock";
import { Audit } from "../../../../shared/application/audit";
import { Result } from "../../../../shared/application/result";
import { AppError, failure } from "../../../../shared/application/errors";
export type UploadMunicipalityLogoError =
  | AppError<"forbidden">
  | AppError<"unsupported_logo">
  | AppError<"logo_too_large">;
@Injectable()
export class UploadMunicipalityLogo {
  constructor(
    private readonly settings: MunicipalitySettingsRepository,
    private readonly clock: Clock,
    private readonly audit: Audit,
  ) {}
  async execute(args: {
    principal: Principal;
    contentType: string;
    data: Uint8Array;
  }): Promise<Result<void, UploadMunicipalityLogoError>> {
    if (!can(args.principal, "municipality:manage"))
      return Result.err(failure("forbidden"));
    if (args.data.byteLength > MAX_LOGO_BYTES)
      return Result.err(failure("logo_too_large"));
    const contentType = detectLogoType(args.data);
    if (!contentType || contentType !== args.contentType)
      return Result.err(failure("unsupported_logo"));
    await this.settings.saveLogo(
      args.principal.tenantId,
      { contentType, data: args.data },
      this.clock.now(),
    );
    await this.audit.record(
      args.principal,
      "municipality.logo_updated",
      args.principal.tenantId,
      { contentType, bytes: args.data.byteLength },
    );
    return Result.ok();
  }
}
