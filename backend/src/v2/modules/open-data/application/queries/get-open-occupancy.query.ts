// SPDX-License-Identifier: AGPL-3.0-or-later
import { Injectable } from "@nestjs/common";
import { Temporal } from "@js-temporal/polyfill";
import { MunicipalityInsights } from "../../../insights/application/municipality-insights";
import { OpenOccupancy } from "../../domain/open-occupancy.read-model";
import { Municipalities } from "../../../../shared/application/municipality-settings";
import { Clock } from "../../../../shared/application/clock";
import { Result } from "../../../../shared/application/result";
import { AppError, failure } from "../../../../shared/application/errors";
/** Weeks published when no range is requested: the last complete ones, as Münster and Paris do. */
export const DEFAULT_OPEN_WEEKS = 12;
export type GetOpenOccupancyError =
  AppError<"not_found"> | AppError<"validation">;
/**
 * Aggregated, anonymous occupancy of one municipality as open data (T3, #21). It reuses the
 * indicators' calculation, so open data and the manager dashboard always agree.
 */
@Injectable()
export class GetOpenOccupancy {
  constructor(
    private readonly insights: MunicipalityInsights,
    private readonly municipalities: Municipalities,
    private readonly clock: Clock,
  ) {}
  async execute(args: {
    slug: string;
    from?: string;
    to?: string;
  }): Promise<Result<OpenOccupancy, GetOpenOccupancyError>> {
    const municipality = await this.municipalities.findBySlug(args.slug);
    if (!municipality) return Result.err(failure("not_found"));
    const today = this.clock
      .now()
      .toZonedDateTimeISO(municipality.timezone)
      .toPlainDate();
    let range: { from: Temporal.PlainDate; to: Temporal.PlainDate } | null;
    if (args.from === undefined && args.to === undefined) {
      const lastSunday = today.subtract({ days: today.dayOfWeek });
      range = {
        from: lastSunday.subtract({ days: DEFAULT_OPEN_WEEKS * 7 - 1 }),
        to: lastSunday,
      };
    } else
      range = this.insights.range(municipality.timezone, {
        from: args.from ?? "",
        to: args.to ?? "",
      });
    if (!range) return Result.err(failure("validation"));
    const weekly = await this.insights.weekly(municipality, range);
    return Result.ok({
      municipality: {
        slug: municipality.slug,
        name: municipality.name,
        dataLicense: municipality.dataLicense,
        dir3Code: municipality.dir3Code,
      },
      generatedOn: today.toString(),
      timezone: municipality.timezone,
      from: range.from.toString(),
      to: range.to.toString(),
      facilities: weekly.facilities.map(({ id, name, sport }) => ({
        id,
        name,
        sport,
      })),
      cells: weekly.cells,
    });
  }
}
