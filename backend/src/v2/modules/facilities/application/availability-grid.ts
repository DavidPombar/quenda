// SPDX-License-Identifier: AGPL-3.0-or-later
import { Injectable } from "@nestjs/common";
import { Temporal } from "@js-temporal/polyfill";
import { FacilityRepository } from "../domain/facility.repository";
import { Facility } from "../domain/facility.entity";
import { Resource } from "../domain/resource.entity";
import { units } from "../domain/resource-units";
import { OpeningCalendar } from "../domain/opening-calendar";
import { HolidayCalendar } from "../domain/holiday-calendar";
import { MunicipalitySettings } from "../../../shared/application/municipality-settings";
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
/**
 * The bookable slots of one facility on one local date, per court. Shared by the public
 * availability and by the slot suggestions (#25), so both offer exactly the same slots.
 */
@Injectable()
export class AvailabilityGrid {
  constructor(
    private readonly facilities: FacilityRepository,
    private readonly calendar: OpeningCalendar,
    private readonly holidays: HolidayCalendar,
  ) {}
  async day(args: {
    municipality: MunicipalitySettings;
    facility: Facility;
    resources: Resource[];
    date: Temporal.PlainDate;
    now: Temporal.Instant;
  }): Promise<ResourceAvailability[]> {
    const { municipality, facility, resources, date, now } = args;
    const empty = () => resources.map((resource) => ({ resource, slots: [] }));
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
      facility.id,
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
    return resources.map((resource): ResourceAvailability => {
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
    });
  }
}
