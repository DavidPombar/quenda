// SPDX-License-Identifier: AGPL-3.0-or-later
import { Injectable } from "@nestjs/common";
import { Temporal } from "@js-temporal/polyfill";
import { FacilityRepository } from "../../domain/facility.repository";
import { ResourceRepository } from "../../domain/resource.repository";
import { Resource } from "../../domain/resource.entity";
import { units } from "../../domain/resource-units";
import { OpeningCalendar } from "../../domain/opening-calendar";
import { HolidayCalendar } from "../../domain/holiday-calendar";
import { Municipalities } from "../../../../shared/application/municipality-settings";
import { Clock } from "../../../../shared/application/clock";
import { Result } from "../../../../shared/application/result";
import { AppError, failure } from "../../../../shared/application/errors";
export interface AvailabilitySlot {
  start: Temporal.Instant;
  end: Temporal.Instant;
  /** `season`: held by a club's season slot (#17). */
  status: "available" | "booked" | "season" | "past";
}
export interface ResourceAvailability {
  resource: Resource;
  /** Empty when the resource is out of service, the facility is not active or the date is out of range. */
  slots: AvailabilitySlot[];
}
export interface Availability {
  resources: ResourceAvailability[];
}
export type GetAvailabilityError =
  AppError<"not_found"> | AppError<"validation">;
@Injectable()
export class GetAvailability {
  constructor(
    private readonly facilities: FacilityRepository,
    private readonly resources: ResourceRepository,
    private readonly municipalities: Municipalities,
    private readonly calendar: OpeningCalendar,
    private readonly holidays: HolidayCalendar,
    private readonly clock: Clock,
  ) {}
  async execute(args: {
    slug: string;
    id: string;
    date: string;
  }): Promise<Result<Availability, GetAvailabilityError>> {
    const municipality = await this.municipalities.findBySlug(args.slug);
    if (!municipality) return Result.err(failure("not_found"));
    const facility = await this.facilities.find(municipality.id, args.id);
    if (!facility) return Result.err(failure("not_found"));
    let date: Temporal.PlainDate;
    try {
      date = Temporal.PlainDate.from(args.date);
    } catch {
      return Result.err(failure("validation"));
    }
    const resources = await this.resources.listByFacility(
      municipality.id,
      facility.id,
    );
    const empty = () =>
      Result.ok({
        resources: resources.map((resource) => ({ resource, slots: [] })),
      });
    const now = this.clock.now();
    const today = now.toZonedDateTimeISO(municipality.timezone).toPlainDate();
    if (
      Temporal.PlainDate.compare(date, today) < 0 ||
      Temporal.PlainDate.compare(
        date,
        today.add({ days: municipality.advanceDays }),
      ) > 0 ||
      facility.status !== "active" ||
      (facility.followsMunicipalHolidays &&
        this.holidays.isHoliday(municipality.holidaysCalendar, date))
    )
      return empty();
    const start = date.toZonedDateTime(municipality.timezone).toInstant();
    const end = date
      .add({ days: 1 })
      .toZonedDateTime(municipality.timezone)
      .toInstant();
    const busy = await this.facilities.busy(
      municipality.id,
      args.id,
      start,
      end,
    );
    const grid: { start: Temporal.Instant; end: Temporal.Instant }[] = [];
    for (const interval of this.calendar.expand({
      calendar: facility.openingCalendar,
      timezone: municipality.timezone,
      date,
    })) {
      for (
        let from = interval.start;
        Temporal.Instant.compare(
          from.add({ minutes: facility.slotMinutes }),
          interval.end,
        ) <= 0;
        from = from.add({ minutes: facility.slotMinutes })
      ) {
        if (
          Temporal.Instant.compare(from, start) < 0 ||
          Temporal.Instant.compare(from, end) >= 0
        )
          continue;
        grid.push({
          start: from,
          end: from.add({ minutes: facility.slotMinutes }),
        });
      }
    }
    return Result.ok({
      resources: resources.map((resource): ResourceAvailability => {
        if (!resource.active) return { resource, slots: [] };
        const occupied = new Set(units(resource, resources));
        return {
          resource,
          slots: grid.map(({ start: from, end: to }): AvailabilitySlot => {
            if (Temporal.Instant.compare(from, now) <= 0)
              return { start: from, end: to, status: "past" };
            const taken = busy.filter(
              (value) =>
                occupied.has(value.unitId) &&
                Temporal.Instant.compare(value.start, to) < 0 &&
                Temporal.Instant.compare(value.end, from) > 0,
            );
            return {
              start: from,
              end: to,
              status: !taken.length
                ? "available"
                : taken.every((value) => value.season)
                  ? "season"
                  : "booked",
            };
          }),
        };
      }),
    });
  }
}
