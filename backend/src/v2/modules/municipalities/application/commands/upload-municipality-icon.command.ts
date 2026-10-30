// SPDX-License-Identifier: AGPL-3.0-or-later
import { Injectable } from "@nestjs/common";
import { MunicipalitySettingsRepository } from "../../domain/municipality-settings.repository";
import { ICON_SIZE, MAX_ICON_BYTES, pngSize } from "../../domain/logo";
import { Principal, can } from "../../../../shared/application/principal";
import { Audit } from "../../../../shared/application/audit";
import { Result } from "../../../../shared/application/result";
import { AppError, failure } from "../../../../shared/application/errors";
export type UploadMunicipalityIconError =
  | AppError<"forbidden">
  | AppError<"unsupported_icon">
  | AppError<"logo_required">;
/** Stores the installed app's icon, which the backoffice draws from the logo (#24). */
@Injectable()
export class UploadMunicipalityIcon {
  constructor(
    private readonly settings: MunicipalitySettingsRepository,
    private readonly audit: Audit,
  ) {}
  async execute(args: {
    principal: Principal;
    data: Uint8Array;
  }): Promise<Result<void, UploadMunicipalityIconError>> {
    if (!can(args.principal, "municipality:manage"))
      return Result.err(failure("forbidden"));
    const size = pngSize(args.data);
    if (
      args.data.byteLength > MAX_ICON_BYTES ||
      size?.width !== ICON_SIZE ||
      size.height !== ICON_SIZE
    )
      return Result.err(failure("unsupported_icon"));
    if (
      !(await this.settings.saveIcon(args.principal.tenantId, {
        data: args.data,
      }))
    )
      return Result.err(failure("logo_required"));
    await this.audit.record(
      args.principal,
      "municipality.icon_updated",
      args.principal.tenantId,
      { bytes: args.data.byteLength },
    );
    return Result.ok();
  }
}
