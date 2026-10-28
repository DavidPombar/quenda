// SPDX-License-Identifier: AGPL-3.0-or-later
import { Injectable } from "@nestjs/common";
import { Insights, MunicipalityInsights } from "../municipality-insights";
import { Principal, can } from "../../../../shared/application/principal";
import { Municipalities } from "../../../../shared/application/municipality-settings";
import { Result } from "../../../../shared/application/result";
import { AppError, failure } from "../../../../shared/application/errors";
export type { Insights } from "../municipality-insights";
export { MAX_RANGE_MONTHS } from "../municipality-insights";
export type GetInsightsError =
  AppError<"forbidden"> | AppError<"not_found"> | AppError<"validation">;
@Injectable()
export class GetInsights {
  constructor(
    private readonly insights: MunicipalityInsights,
    private readonly municipalities: Municipalities,
  ) {}
  async execute(args: {
    principal: Principal;
    from?: string;
    to?: string;
  }): Promise<Result<Insights, GetInsightsError>> {
    if (!can(args.principal, "insights:view"))
      return Result.err(failure("forbidden"));
    const settings = await this.municipalities.find(args.principal.tenantId);
    if (!settings) return Result.err(failure("not_found"));
    const range = this.insights.range(settings.timezone, args);
    if (!range) return Result.err(failure("validation"));
    return Result.ok(await this.insights.report(settings, range));
  }
}
