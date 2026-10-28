// SPDX-License-Identifier: AGPL-3.0-or-later
import { Get, Header, Param, UseGuards } from "@nestjs/common";
import { ApiOperation, ApiProduces, ApiResponse } from "@nestjs/swagger";
import { V2Controller } from "../../../../../shared/infrastructure/api/v2-controller.decorator";
import { Queries } from "../../../../../shared/infrastructure/queries.locator";
import {
  PrincipalGuard,
  CurrentPrincipal,
} from "../../../../../shared/infrastructure/api/principal.guard";
import { Principal } from "../../../../../shared/application/principal";
import { ProblemException } from "../../../../../shared/infrastructure/api/problem";
import { assertNever } from "../../../../../shared/application/errors";
import {
  GetBookingCalendar,
  GetBookingCalendarError,
} from "../../../application/queries/get-booking-calendar.query";
import { bookingCalendar } from "../../calendar/ical-booking-calendar";
import { BookingIdPathRequestDTO } from "../dto/booking-id-path.request.dto";
@V2Controller("citizen/bookings")
@UseGuards(PrincipalGuard)
export class GetBookingCalendarController {
  private readonly operation;
  constructor(locator: Queries) {
    this.operation = locator.get(GetBookingCalendar);
  }
  @Get(":id/calendar.ics")
  @Header("Content-Type", "text/calendar; charset=utf-8")
  @Header("Content-Disposition", 'attachment; filename="quenda-reserva.ics"')
  @ApiOperation({ summary: "Download one reservation as RFC 5545 iCalendar" })
  @ApiProduces("text/calendar")
  @ApiResponse({ status: 200, description: "VCALENDAR with one VEVENT" })
  async handle(
    @CurrentPrincipal() principal: Principal,
    @Param() path: BookingIdPathRequestDTO,
  ): Promise<string> {
    const result = await this.operation.execute({ principal, id: path.id });
    return result.fold(bookingCalendar, this.handleError);
  }
  private handleError(this: void, error: GetBookingCalendarError): never {
    switch (error.code) {
      case "forbidden":
        throw new ProblemException(403, error);
      case "not_found":
        throw new ProblemException(404, error);
      default:
        return assertNever(error);
    }
  }
}
