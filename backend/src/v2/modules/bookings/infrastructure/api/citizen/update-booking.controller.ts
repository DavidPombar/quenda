// SPDX-License-Identifier: AGPL-3.0-or-later
import { Patch, Body, Param, UseGuards, HttpCode } from "@nestjs/common";
import { ApiOperation, ApiResponse } from "@nestjs/swagger";
import { V2Controller } from "../../../../../shared/infrastructure/api/v2-controller.decorator";
import { Commands } from "../../../../../shared/infrastructure/commands.locator";
import { UpdateBooking } from "../../../application/commands/update-booking.command";
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
import { UpdateBookingRequestDTO } from "../dto/update-booking.request.dto";
import { IdPathRequestDTO } from "../dto/id-path.request.dto";
@V2Controller("citizen/bookings")
@UseGuards(PrincipalGuard)
export class UpdateBookingController {
  private readonly operation;
  constructor(locator: Commands) {
    this.operation = locator.get(UpdateBooking);
  }
  @Patch(":id")
  @HttpCode(204)
  @ApiOperation({ summary: "UpdateBooking" })
  @ApiResponse({ status: 204, description: "Successful operation" })
  async handle(
    @CurrentPrincipal() principal: Principal,
    @Param() path: IdPathRequestDTO,
    @Body() body: UpdateBookingRequestDTO,
  ): Promise<void> {
    const result = await this.operation.execute({
      principal,
      id: path.id,
      start: body.start,
      resourceId: body.resourceId,
      status: body.status,
    });
    return result.fold(() => undefined, this.handleError);
  }
  private handleError(
    this: void,
    error:
      | AppError<"forbidden">
      | AppError<"not_found">
      | AppError<"validation">
      | AppError<"outside_opening">
      | AppError<"booking_window">
      | AppError<"cancellation_deadline">
      | AppError<"booking_cancelled">
      | AppError<"slot_taken">
      | AppError<"id_reused">
      | AppError<"resource_required">
      | AppError<"resource_unavailable">,
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
      case "cancellation_deadline":
        throw new ProblemException(422, error);
      case "booking_cancelled":
        throw new ProblemException(422, error);
      case "slot_taken":
        throw new ProblemException(409, error);
      case "id_reused":
        throw new ProblemException(409, error);
      case "resource_required":
        throw new ProblemException(422, error);
      case "resource_unavailable":
        throw new ProblemException(422, error);
      default:
        return assertNever(error);
    }
  }
}
