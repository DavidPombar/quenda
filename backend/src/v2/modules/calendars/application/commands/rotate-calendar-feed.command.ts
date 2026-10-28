// SPDX-License-Identifier: AGPL-3.0-or-later
import { Injectable } from "@nestjs/common";
import type { Temporal } from "@js-temporal/polyfill";
import { CalendarFeedRepository } from "../../domain/calendar-feed.repository";
import { Principal, can } from "../../../../shared/application/principal";
import { Clock } from "../../../../shared/application/clock";
import { Audit } from "../../../../shared/application/audit";
import { Result } from "../../../../shared/application/result";
import { AppError, failure } from "../../../../shared/application/errors";
@Injectable()
export class RotateCalendarFeed {
  constructor(
    private readonly feeds: CalendarFeedRepository,
    private readonly clock: Clock,
    private readonly audit: Audit,
  ) {}
  /** Issues a new subscription token; any previous link stops working. */
  async execute(args: {
    principal: Principal;
  }): Promise<
    Result<
      { token: string; createdAt: Temporal.Instant },
      AppError<"forbidden">
    >
  > {
    if (!can(args.principal, "bookings:own"))
      return Result.err(failure("forbidden"));
    const createdAt = this.clock.now();
    const token = await this.feeds.rotate(args.principal, createdAt);
    await this.audit.record(
      args.principal,
      "calendar_feed.rotated",
      args.principal.userId,
    );
    return Result.ok({ token, createdAt });
  }
}
