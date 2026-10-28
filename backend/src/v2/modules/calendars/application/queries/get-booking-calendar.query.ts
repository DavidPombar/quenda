// SPDX-License-Identifier: AGPL-3.0-or-later
import { Injectable } from "@nestjs/common";
import { CalendarEntryRepository } from "../../domain/calendar-entry.repository";
import { CalendarDocument } from "../../domain/calendar-entry.read-model";
import { Principal, can } from "../../../../shared/application/principal";
import { Clock } from "../../../../shared/application/clock";
import { Result } from "../../../../shared/application/result";
import { AppError, failure } from "../../../../shared/application/errors";
export type GetBookingCalendarError =
  AppError<"forbidden"> | AppError<"not_found">;
@Injectable()
export class GetBookingCalendar {
  constructor(
    private readonly entries: CalendarEntryRepository,
    private readonly clock: Clock,
  ) {}
  async execute(args: {
    principal: Principal;
    id: string;
  }): Promise<Result<CalendarDocument, GetBookingCalendarError>> {
    if (!can(args.principal, "bookings:own"))
      return Result.err(failure("forbidden"));
    const entry = await this.entries.find(
      args.principal.tenantId,
      args.principal.userId,
      args.id,
    );
    if (!entry) return Result.err(failure("not_found"));
    return Result.ok({ entries: [entry], generatedAt: this.clock.now() });
  }
}
