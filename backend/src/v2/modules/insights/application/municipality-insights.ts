// SPDX-License-Identifier: AGPL-3.0-or-later
import { Injectable } from "@nestjs/common";
import { Temporal } from "@js-temporal/polyfill";
import { InsightsRepository } from "../domain/insights.repository";
import { OccupancyReport, Span, occupancyReport } from "../domain/occupancy";
import { OpeningCalendar } from "../../facilities/domain/opening-calendar";
import { HolidayCalendar } from "../../facilities/domain/holiday-calendar";
import { Clock } from "../../../shared/application/clock";
import { MunicipalitySettings } from "../../../shared/application/municipality-settings";
/** Longest range a manager or operator can request (agreed in #15). */
export const MAX_RANGE_MONTHS = 16;
const DEFAULT_DAYS = 7;
export interface Insights extends OccupancyReport {
  slug: string;
  /** First and last included local dates. */
  from: string;
  to: string;
  total: number;
  facilities: number;
}
export interface DateRange {
  from: Temporal.PlainDate;
  to: Temporal.PlainDate;
}
function parseDate(value: string) {
  try {
    return Temporal.PlainDate.from(value, { overflow: "reject" });
  } catch {
    return null;
  }
}
/**
 * Aggregated, anonymous indicators of one municipality. Shared by the manager's own view and
 * the supramunicipal operator, who sees them for every municipality (#18).
 */
@Injectable()
export class MunicipalityInsights {
  constructor(
    private readonly repository: InsightsRepository,
    private readonly calendar: OpeningCalendar,
    private readonly holidays: HolidayCalendar,
    private readonly clock: Clock,
  ) {}
  /** Inclusive local dates; without both, the coming week. Null when invalid or too long. */
  range(
    timezone: string,
    args: { from?: string; to?: string },
  ): DateRange | null {
    let from: Temporal.PlainDate | null;
    let to: Temporal.PlainDate | null;
    if (args.from === undefined && args.to === undefined) {
      // Without a range the dashboard shows the coming week.
      from = this.clock.now().toZonedDateTimeISO(timezone).toPlainDate();
      to = from.add({ days: DEFAULT_DAYS - 1 });
    } else {
      from = parseDate(args.from ?? "");
      to = parseDate(args.to ?? "");
    }
    if (
      !from ||
      !to ||
      Temporal.PlainDate.compare(from, to) > 0 ||
      Temporal.PlainDate.compare(to, from.add({ months: MAX_RANGE_MONTHS })) >=
        0
    )
      return null;
    return { from, to };
  }
  async report(
    settings: MunicipalitySettings,
    { from, to }: DateRange,
  ): Promise<Insights> {
    const timezone = settings.timezone;
    const start = from.toZonedDateTime(timezone).toInstant();
    const end = to.add({ days: 1 }).toZonedDateTime(timezone).toInstant();
    const [facilities, periods, bookings] = await Promise.all([
      this.repository.facilities(settings.id),
      this.repository.statusPeriods(settings.id, start, end),
      this.repository.bookings(settings.id, start, end),
    ]);
    const holidays: Span[] = [];
    for (
      let date = from;
      Temporal.PlainDate.compare(date, to) <= 0;
      date = date.add({ days: 1 })
    )
      if (this.holidays.isHoliday(settings.holidaysCalendar, date))
        holidays.push({
          start: date.toZonedDateTime(timezone).toInstant(),
          end: date.add({ days: 1 }).toZonedDateTime(timezone).toInstant(),
        });
    const report = occupancyReport({
      timezone,
      from,
      to,
      facilities: facilities.map((facility) => {
        const own = periods.filter(
          (period) => period.facilityId === facility.id,
        );
        // Facilities without recorded history keep their current status for the whole range.
        const active = own.length
          ? own
              .filter((period) => period.status === "active")
              .map((period) => ({
                start: period.start,
                end: period.end ?? end,
              }))
          : facility.status === "active" && !facility.hasStatusHistory
            ? [{ start, end }]
            : [];
        return {
          id: facility.id,
          name: facility.name,
          sport: facility.sport,
          unitIds: facility.unitIds,
          resources: facility.resources,
          open: this.calendar.expandRange({
            calendar: facility.openingCalendar,
            timezone,
            from,
            to,
          }),
          active,
          closed: facility.followsMunicipalHolidays ? holidays : [],
          bookings: bookings.filter(
            (booking) => booking.facilityId === facility.id,
          ),
        };
      }),
    });
    return {
      ...report,
      slug: settings.slug,
      from: from.toString(),
      to: to.toString(),
      total: report.confirmed + report.cancelled + report.noShows,
      facilities: facilities.length,
    };
  }
}
