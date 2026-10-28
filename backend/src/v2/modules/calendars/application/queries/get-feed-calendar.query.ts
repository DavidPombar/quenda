// SPDX-License-Identifier: AGPL-3.0-or-later
import { Injectable } from "@nestjs/common";
import { CalendarEntryRepository } from "../../domain/calendar-entry.repository";
import { CalendarFeedRepository } from "../../domain/calendar-feed.repository";
import { CalendarDocument } from "../../domain/calendar-entry.read-model";
import { Clock } from "../../../../shared/application/clock";
import { Result } from "../../../../shared/application/result";
import { AppError, failure } from "../../../../shared/application/errors";
// Recent history kept in the feed so calendar clients see late cancellations.
const HISTORY_DAYS = 30;
@Injectable()
export class GetFeedCalendar {
  constructor(
    private readonly feeds: CalendarFeedRepository,
    private readonly entries: CalendarEntryRepository,
    private readonly clock: Clock,
  ) {}
  /** The token is the credential: calendar clients cannot send session cookies. */
  async execute(args: {
    token: string;
  }): Promise<Result<CalendarDocument, AppError<"not_found">>> {
    const owner = await this.feeds.findOwner(args.token);
    if (!owner) return Result.err(failure("not_found"));
    const now = this.clock.now();
    return Result.ok({
      entries: await this.entries.listEndingAfter(
        owner.tenantId,
        owner.userId,
        now.subtract({ hours: HISTORY_DAYS * 24 }),
      ),
      generatedAt: now,
    });
  }
}
