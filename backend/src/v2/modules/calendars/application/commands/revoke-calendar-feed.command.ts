// SPDX-License-Identifier: AGPL-3.0-or-later
import { Injectable } from "@nestjs/common";
import { CalendarFeedRepository } from "../../domain/calendar-feed.repository";
import { Principal, can } from "../../../../shared/application/principal";
import { Audit } from "../../../../shared/application/audit";
import { Result } from "../../../../shared/application/result";
import { AppError, failure } from "../../../../shared/application/errors";
@Injectable()
export class RevokeCalendarFeed {
  constructor(
    private readonly feeds: CalendarFeedRepository,
    private readonly audit: Audit,
  ) {}
  async execute(args: {
    principal: Principal;
  }): Promise<Result<void, AppError<"forbidden">>> {
    if (!can(args.principal, "bookings:own"))
      return Result.err(failure("forbidden"));
    if (!(await this.feeds.createdAt(args.principal))) return Result.ok();
    await this.feeds.revoke(args.principal);
    await this.audit.record(
      args.principal,
      "calendar_feed.revoked",
      args.principal.userId,
    );
    return Result.ok();
  }
}
