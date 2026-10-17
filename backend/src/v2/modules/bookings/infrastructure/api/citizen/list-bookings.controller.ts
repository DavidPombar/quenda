// SPDX-License-Identifier: AGPL-3.0-or-later
import { Get, UseGuards } from "@nestjs/common";
import { ApiOperation, ApiResponse } from "@nestjs/swagger";
import { V2Controller } from "../../../../../shared/infrastructure/api/v2-controller.decorator";
import { Queries } from "../../../../../shared/infrastructure/queries.locator";
import { ListBookings } from "../../../application/queries/list-bookings.query";
import {
  PrincipalGuard,
  CurrentPrincipal,
} from "../../../../../shared/infrastructure/api/principal.guard";
import { Principal } from "../../../../../shared/application/principal";
import { ProblemException } from "../../../../../shared/infrastructure/api/problem";
import { AppError } from "../../../../../shared/application/errors";
import { BookingHistoryResponseDTO } from "../dto/booking-history.response.dto";
@V2Controller("citizen/bookings")
@UseGuards(PrincipalGuard)
export class ListBookingsController {
  private readonly operation;
  constructor(locator: Queries) {
    this.operation = locator.get(ListBookings);
  }
  @Get()
  @ApiOperation({ summary: "ListBookings" })
  @ApiResponse({
    status: 200,
    description: "Successful operation",
    type: BookingHistoryResponseDTO,
    isArray: true,
  })
  async handle(
    @CurrentPrincipal() principal: Principal,
  ): Promise<BookingHistoryResponseDTO[]> {
    const result = await this.operation.execute({ principal });
    return result.fold(
      (values) => values.map(BookingHistoryResponseDTO.from),
      this.handleError,
    );
  }
  private handleError(this: void, error: AppError<"forbidden">): never {
    throw new ProblemException(403, error);
  }
}
