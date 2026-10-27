// SPDX-License-Identifier: AGPL-3.0-or-later
import { Injectable } from "@nestjs/common";
import {
  Insights,
  MunicipalityInsights,
} from "../../../insights/application/municipality-insights";
import { figures } from "../../../insights/domain/occupancy";
import { Municipalities } from "../../../../shared/application/municipality-settings";
import {
  OperatorPrincipal,
  canOperate,
} from "../../../../shared/application/operator-principal";
import { Result } from "../../../../shared/application/result";
import { AppError, failure } from "../../../../shared/application/errors";
type Totals = Pick<
  Insights,
  | "total"
  | "confirmed"
  | "cancelled"
  | "noShows"
  | "bookedMinutes"
  | "openMinutes"
  | "occupancy"
  | "facilities"
>;
export interface MunicipalityTotals extends Totals {
  id: string;
  slug: string;
  name: string;
  from: string;
  to: string;
}
export interface DeploymentInsights extends Totals {
  municipalities: MunicipalityTotals[];
}
export type GetDeploymentInsightsError =
  AppError<"forbidden"> | AppError<"validation">;
/** Per-municipality totals only: no facility detail, bookings or people (#18). */
@Injectable()
export class GetDeploymentInsights {
  constructor(
    private readonly insights: MunicipalityInsights,
    private readonly municipalities: Municipalities,
  ) {}
  async execute(args: {
    principal: OperatorPrincipal;
    from?: string;
    to?: string;
  }): Promise<Result<DeploymentInsights, GetDeploymentInsightsError>> {
    if (!canOperate(args.principal, "deployment:insights"))
      return Result.err(failure("forbidden"));
    const rows: MunicipalityTotals[] = [];
    for (const settings of await this.municipalities.list()) {
      const range = this.insights.range(settings.timezone, args);
      if (!range) return Result.err(failure("validation"));
      const report = await this.insights.report(settings, range);
      rows.push({
        id: settings.id,
        slug: settings.slug,
        name: settings.name,
        from: report.from,
        to: report.to,
        total: report.total,
        confirmed: report.confirmed,
        cancelled: report.cancelled,
        noShows: report.noShows,
        bookedMinutes: report.bookedMinutes,
        openMinutes: report.openMinutes,
        occupancy: report.occupancy,
        facilities: report.facilities,
      });
    }
    const sum = (
      key:
        | "total"
        | "confirmed"
        | "cancelled"
        | "noShows"
        | "bookedMinutes"
        | "openMinutes"
        | "facilities",
    ) => rows.reduce((total, row) => total + row[key], 0);
    return Result.ok({
      municipalities: rows,
      total: sum("total"),
      confirmed: sum("confirmed"),
      cancelled: sum("cancelled"),
      noShows: sum("noShows"),
      facilities: sum("facilities"),
      ...figures(sum("bookedMinutes"), sum("openMinutes")),
    });
  }
}
