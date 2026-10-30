// SPDX-License-Identifier: AGPL-3.0-or-later
import { Injectable } from "@nestjs/common";
import { FacilityRepository } from "../../domain/facility.repository";
import { FacilityWithSchedule } from "../../domain/facility.read-model";
import { OpeningCalendar } from "../../domain/opening-calendar";
import { HolidayCalendar } from "../../domain/holiday-calendar";
import { openingWeek } from "../../domain/opening-week";
import { FacilityDescriber } from "../facility-details";
import { Municipalities } from "../../../../shared/application/municipality-settings";
import { Clock } from "../../../../shared/application/clock";
import { Result } from "../../../../shared/application/result";
import { AppError, failure } from "../../../../shared/application/errors";
const WEEK = 7;
/** Public facility page with photos and the opening hours of the coming week (#26). */
@Injectable()
export class GetFacility {
  constructor(
    private readonly facilities: FacilityRepository,
    private readonly describer: FacilityDescriber,
    private readonly municipalities: Municipalities,
    private readonly calendar: OpeningCalendar,
    private readonly holidays: HolidayCalendar,
    private readonly clock: Clock,
  ) {}
  async execute(args: {
    slug: string;
    id: string;
  }): Promise<Result<FacilityWithSchedule, AppError<"not_found">>> {
    const municipality = await this.municipalities.findBySlug(args.slug);
    if (!municipality) return Result.err(failure("not_found"));
    const facility = await this.facilities.find(municipality.id, args.id);
    if (!facility) return Result.err(failure("not_found"));
    const [details] = await this.describer.describe(municipality.id, [
      facility,
    ]);
    const today = this.clock
      .now()
      .toZonedDateTimeISO(municipality.timezone)
      .toPlainDate();
    return Result.ok({
      ...details,
      openingWeek: openingWeek({
        from: today,
        days: WEEK,
        timezone: municipality.timezone,
        intervals:
          facility.status === "active"
            ? this.calendar.expandRange({
                calendar: facility.openingCalendar,
                timezone: municipality.timezone,
                from: today,
                to: today.add({ days: WEEK - 1 }),
              })
            : [],
        isHoliday: (date) =>
          facility.followsMunicipalHolidays &&
          this.holidays.isHoliday(municipality.holidaysCalendar, date),
      }),
    });
  }
}
