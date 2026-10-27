// SPDX-License-Identifier: AGPL-3.0-or-later
import { Injectable } from "@nestjs/common";
import { InsightsRepository } from "../../domain/insights.repository";
import { OpeningCalendar } from "../../../facilities/domain/opening-calendar";
import { Principal, can } from "../../../../shared/application/principal";
import { Clock } from "../../../../shared/application/clock";
import { Municipalities } from "../../../../shared/application/municipality-settings";
import { Result } from "../../../../shared/application/result";
import { AppError, failure } from "../../../../shared/application/errors";
export interface Insights {
  total: number;
  confirmed: number;
  cancelled: number;
  /** Booked but not used (M3); excluded from occupancy. */
  noShows: number;
  occupancy: number;
  facilities: number;
  from: string;
  to: string;
  byFacility: { id: string; name: string; bookings: number; noShows: number }[];
}
@Injectable()
export class GetInsights {
  constructor(
    private readonly repository: InsightsRepository,
    private readonly calendar: OpeningCalendar,
    private readonly clock: Clock,
    private readonly municipalities: Municipalities,
  ) {}
  async execute(args: {
    principal: Principal;
  }): Promise<Result<Insights, AppError<"forbidden"> | AppError<"not_found">>> {
    if (!can(args.principal, "insights:view"))
      return Result.err(failure("forbidden"));
    const settings = await this.municipalities.find(args.principal.tenantId);
    if (!settings) return Result.err(failure("not_found"));
    const date = this.clock
      .now()
      .toZonedDateTimeISO(settings.timezone)
      .toPlainDate();
    const from = date.toZonedDateTime(settings.timezone).toInstant();
    const to = date
      .add({ days: 7 })
      .toZonedDateTime(settings.timezone)
      .toInstant();
    const rows = await this.repository.usage(
      settings.id,
      from.toString(),
      to.toString(),
    );
    let capacity = 0;
    for (const row of rows.filter((item) => item.status === "active"))
      for (let i = 0; i < 7; i++)
        for (const interval of this.calendar.expand({
          calendar: row.openingCalendar,
          timezone: settings.timezone,
          date: date.add({ days: i }),
        })) {
          const start = Math.max(
            interval.start.epochMilliseconds,
            date.add({ days: i }).toZonedDateTime(settings.timezone)
              .epochMilliseconds,
          );
          const end = Math.min(
            interval.end.epochMilliseconds,
            date.add({ days: i + 1 }).toZonedDateTime(settings.timezone)
              .epochMilliseconds,
          );
          capacity += (end - start) / 60000;
        }
    const confirmed = rows.reduce((sum, row) => sum + row.bookings, 0);
    const cancelled = rows.reduce((sum, row) => sum + row.cancelled, 0);
    const noShows = rows.reduce((sum, row) => sum + row.noShows, 0);
    const result: Insights = {
      total: confirmed + cancelled + noShows,
      confirmed,
      cancelled,
      noShows,
      facilities: rows.length,
      occupancy: capacity
        ? Math.round(
            (rows.reduce((sum, row) => sum + row.minutes, 0) / capacity) * 100,
          )
        : 0,
      from: date.toString(),
      to: date.add({ days: 6 }).toString(),
      byFacility: rows.map((row) => ({
        id: row.id,
        name: row.name,
        bookings: row.bookings,
        noShows: row.noShows,
      })),
    };
    return Result.ok(result);
  }
}
