// SPDX-License-Identifier: AGPL-3.0-or-later
import { Injectable } from "@nestjs/common";
import type { Temporal } from "@js-temporal/polyfill";
import { CalendarFeedRepository } from "../../domain/calendar-feed.repository";
import { Principal, can } from "../../../../shared/application/principal";
import { Result } from "../../../../shared/application/result";
import { AppError, failure } from "../../../../shared/application/errors";
@Injectable()
export class GetCalendarFeed {
  constructor(private readonly feeds: CalendarFeedRepository) {}
  async execute(args: {
    principal: Principal;
  }): Promise<
    Result<{ createdAt: Temporal.Instant | null }, AppError<"forbidden">>
  > {
    if (!can(args.principal, "bookings:own"))
      return Result.err(failure("forbidden"));
    return Result.ok({
      createdAt: await this.feeds.createdAt(args.principal),
    });
  }
}
