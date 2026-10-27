// SPDX-License-Identifier: AGPL-3.0-or-later
import { Patch, Body, Param, UseGuards, HttpCode } from "@nestjs/common";
import { ApiOperation, ApiResponse } from "@nestjs/swagger";
import { V2Controller } from "../../../../../shared/infrastructure/api/v2-controller.decorator";
import { Commands } from "../../../../../shared/infrastructure/commands.locator";
import {
  ManageBooking,
  ManageBookingChange,
  ManageBookingError,
} from "../../../application/commands/manage-booking.command";
import {
  PrincipalGuard,
  CurrentPrincipal,
} from "../../../../../shared/infrastructure/api/principal.guard";
import { Principal } from "../../../../../shared/application/principal";
import { ProblemException } from "../../../../../shared/infrastructure/api/problem";
import { assertNever, failure } from "../../../../../shared/application/errors";
import { ManageBookingRequestDTO } from "../dto/manage-booking.request.dto";
import { IdPathRequestDTO } from "../dto/id-path.request.dto";
@V2Controller("manager/bookings")
@UseGuards(PrincipalGuard)
export class ManageBookingController {
  private readonly operation;
  constructor(locator: Commands) {
    this.operation = locator.get(ManageBooking);
  }
  @Patch(":id")
  @HttpCode(204)
  @ApiOperation({ summary: "ManageBooking" })
  @ApiResponse({ status: 204, description: "Successful operation" })
  async handle(
    @CurrentPrincipal() principal: Principal,
    @Param() path: IdPathRequestDTO,
    @Body() body: ManageBookingRequestDTO,
  ): Promise<void> {
    const change: ManageBookingChange | null =
      body.attendance && !body.status && body.reason === undefined
        ? { attendance: body.attendance }
        : body.status && !body.attendance && body.reason !== undefined
          ? { status: body.status, reason: body.reason }
          : null;
    if (!change) throw new ProblemException(400, failure("validation"));
    const result = await this.operation.execute({
      principal,
      id: path.id,
      change,
    });
    return result.fold(() => undefined, this.handleError);
  }
  private handleError(this: void, error: ManageBookingError): never {
    switch (error.code) {
      case "forbidden":
        throw new ProblemException(403, error);
      case "not_found":
        throw new ProblemException(404, error);
      case "validation":
        throw new ProblemException(400, error);
      case "attendance_window":
        throw new ProblemException(422, error);
      case "cancellation_deadline":
        throw new ProblemException(422, error);
      case "booking_cancelled":
        throw new ProblemException(422, error);
      default:
        return assertNever(error);
    }
  }
}
