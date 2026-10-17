// SPDX-License-Identifier: AGPL-3.0-or-later
import { Post, Body, UseGuards } from "@nestjs/common";
import { ApiOperation, ApiResponse } from "@nestjs/swagger";
import { V2Controller } from "../../../../../shared/infrastructure/api/v2-controller.decorator";
import { Commands } from "../../../../../shared/infrastructure/commands.locator";
import { CreateBooking } from "../../../application/commands/create-booking.command";
import {
  PrincipalGuard,
  CurrentPrincipal,
} from "../../../../../shared/infrastructure/api/principal.guard";
import { Principal } from "../../../../../shared/application/principal";
import { ProblemException } from "../../../../../shared/infrastructure/api/problem";
import {
  AppError,
  assertNever,
} from "../../../../../shared/application/errors";
import { CreateBookingRequestDTO } from "../dto/create-booking.request.dto";
import { BookingResponseDTO } from "../dto/booking.response.dto";
@V2Controller("citizen/bookings")
@UseGuards(PrincipalGuard)
export class CreateBookingController {
  private readonly operation;
  constructor(locator: Commands) {
    this.operation = locator.get(CreateBooking);
  }
  @Post()
  @ApiOperation({ summary: "CreateBooking" })
  @ApiResponse({
    status: 201,
    description: "Successful operation",
    type: BookingResponseDTO,
    isArray: false,
  })
  async handle(
    @CurrentPrincipal() principal: Principal,
    @Body() body: CreateBookingRequestDTO,
  ): Promise<BookingResponseDTO> {
    const result = await this.operation.execute({
      principal,
      id: body.id,
      facilityId: body.facilityId,
      start: body.start,
    });
    return result.fold(BookingResponseDTO.from, this.handleError);
  }
  private handleError(
    this: void,
    error:
      | AppError<"forbidden">
      | AppError<"not_found">
      | AppError<"validation">
      | AppError<"outside_opening">
      | AppError<"booking_window">
      | AppError<"booking_limit">
      | AppError<"slot_taken">
      | AppError<"id_reused">,
  ): never {
    switch (error.code) {
      case "forbidden":
        throw new ProblemException(403, error);
      case "not_found":
        throw new ProblemException(404, error);
      case "validation":
        throw new ProblemException(400, error);
      case "outside_opening":
        throw new ProblemException(422, error);
      case "booking_window":
        throw new ProblemException(422, error);
      case "booking_limit":
        throw new ProblemException(422, error);
      case "slot_taken":
        throw new ProblemException(409, error);
      case "id_reused":
        throw new ProblemException(409, error);
      default:
        return assertNever(error);
    }
  }
}
