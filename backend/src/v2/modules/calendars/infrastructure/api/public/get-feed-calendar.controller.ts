// SPDX-License-Identifier: AGPL-3.0-or-later
import { Get, Header, Param } from "@nestjs/common";
import { ApiOperation, ApiProduces, ApiResponse } from "@nestjs/swagger";
import { V2Controller } from "../../../../../shared/infrastructure/api/v2-controller.decorator";
import { Queries } from "../../../../../shared/infrastructure/queries.locator";
import { ProblemException } from "../../../../../shared/infrastructure/api/problem";
import { AppError } from "../../../../../shared/application/errors";
import { GetFeedCalendar } from "../../../application/queries/get-feed-calendar.query";
import { bookingCalendar } from "../../calendar/ical-booking-calendar";
import { FeedTokenPathRequestDTO } from "../dto/feed-token-path.request.dto";
@V2Controller("public/calendar-feeds")
export class GetFeedCalendarController {
  private readonly operation;
  constructor(locator: Queries) {
    this.operation = locator.get(GetFeedCalendar);
  }
  @Get(":token.ics")
  @Header("Content-Type", "text/calendar; charset=utf-8")
  @ApiOperation({
    summary:
      "Personal RFC 5545 subscription feed (webcal). The secret token authenticates calendar clients; revoked tokens return 404.",
  })
  @ApiProduces("text/calendar")
  @ApiResponse({
    status: 200,
    description: "VCALENDAR of the person's bookings",
  })
  async handle(@Param() path: FeedTokenPathRequestDTO): Promise<string> {
    const result = await this.operation.execute({ token: path.token });
    return result.fold(bookingCalendar, this.handleError);
  }
  private handleError(this: void, error: AppError<"not_found">): never {
    throw new ProblemException(404, error);
  }
}
