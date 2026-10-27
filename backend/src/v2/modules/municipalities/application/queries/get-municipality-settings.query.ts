// SPDX-License-Identifier: AGPL-3.0-or-later
import { Injectable } from "@nestjs/common";
import {
  Municipalities,
  MunicipalitySettings,
} from "../../../../shared/application/municipality-settings";
import { Principal, can } from "../../../../shared/application/principal";
import { Result } from "../../../../shared/application/result";
import { AppError, failure } from "../../../../shared/application/errors";
export type GetMunicipalitySettingsError =
  AppError<"forbidden"> | AppError<"not_found">;
@Injectable()
export class GetMunicipalitySettings {
  constructor(private readonly municipalities: Municipalities) {}
  async execute(args: {
    principal: Principal;
  }): Promise<Result<MunicipalitySettings, GetMunicipalitySettingsError>> {
    if (!can(args.principal, "municipality:manage"))
      return Result.err(failure("forbidden"));
    const settings = await this.municipalities.find(args.principal.tenantId);
    return settings ? Result.ok(settings) : Result.err(failure("not_found"));
  }
}
