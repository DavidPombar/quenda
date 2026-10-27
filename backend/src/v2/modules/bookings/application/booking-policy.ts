// SPDX-License-Identifier: AGPL-3.0-or-later
import { Injectable } from "@nestjs/common";
import { Temporal } from "@js-temporal/polyfill";
import { OpeningCalendar } from "../../facilities/domain/opening-calendar";
import { HolidayCalendar } from "../../facilities/domain/holiday-calendar";
import { MunicipalitySettings } from "../../../shared/application/municipality-settings";
import { FacilityScheduleData } from "../domain/facility-schedule";
import { Result } from "../../../shared/application/result";
import { AppError, failure } from "../../../shared/application/errors";
export type BookingPolicyError =
  | AppError<"validation">
  | AppError<"booking_window">
  | AppError<"outside_opening">;
@Injectable()
export class BookingPolicy {
  constructor(
    private readonly calendar: OpeningCalendar,
    private readonly holidays: HolidayCalendar,
  ) {}
  validate(args: {
    start: string;
    facility: FacilityScheduleData;
    settings: MunicipalitySettings;
    now: Temporal.Instant;
  }): Result<
    { start: Temporal.Instant; end: Temporal.Instant },
    BookingPolicyError
  > {
    let start: Temporal.Instant;
    try {
      start = Temporal.Instant.from(args.start);
    } catch {
      return Result.err(failure("validation"));
    }
    const localDate = start
      .toZonedDateTimeISO(args.settings.timezone)
      .toPlainDate();
    const lastDay = args.now
      .toZonedDateTimeISO(args.settings.timezone)
      .toPlainDate()
      .add({ days: args.settings.advanceDays });
    if (
      Temporal.Instant.compare(start, args.now) <= 0 ||
      Temporal.PlainDate.compare(localDate, lastDay) > 0
    )
      return Result.err(failure("booking_window"));
    const end = start.add({ minutes: args.facility.slotMinutes });
    const fits =
      args.facility.status === "active" &&
      !(
        args.facility.followsMunicipalHolidays &&
        this.holidays.isHoliday(args.settings.holidaysCalendar, localDate)
      ) &&
      this.calendar
        .expand({
          calendar: args.facility.openingCalendar,
          timezone: args.settings.timezone,
          date: localDate,
        })
        .some(
          (interval) =>
            Temporal.Instant.compare(start, interval.start) >= 0 &&
            Temporal.Instant.compare(end, interval.end) <= 0 &&
            (start.epochNanoseconds - interval.start.epochNanoseconds) %
              BigInt(args.facility.slotMinutes * 60 * 1e9) ===
              0n,
        );
    if (!fits) return Result.err(failure("outside_opening"));
    return Result.ok({ start, end });
  }
}
