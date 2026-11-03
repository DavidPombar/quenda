// SPDX-License-Identifier: AGPL-3.0-or-later
import { Body, HttpCode, Post, UseGuards } from "@nestjs/common";
import { ApiOperation, ApiResponse } from "@nestjs/swagger";
import { V2Controller } from "../../../../../shared/infrastructure/api/v2-controller.decorator";
import { Commands } from "../../../../../shared/infrastructure/commands.locator";
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
import { RecordAttendance } from "../../../application/commands/record-attendance.command";
import { AttendanceRequestDTO } from "../dto/attendance.request.dto";
import { AttendanceResponseDTO } from "../dto/attendance.response.dto";
@V2Controller("access/attendance")
@UseGuards(PrincipalGuard)
export class RecordAttendanceController {
  private readonly operation;
  constructor(locator: Commands) {
    this.operation = locator.get(RecordAttendance);
  }
  @Post()
  @HttpCode(200)
  @ApiOperation({
    summary: "RecordAttendance",
    description:
      "Roll-call marks of activity sessions; each item gets its own outcome",
  })
  @ApiResponse({ status: 200, type: AttendanceResponseDTO })
  async handle(
    @CurrentPrincipal() principal: Principal,
    @Body() body: AttendanceRequestDTO,
  ): Promise<AttendanceResponseDTO> {
    const result = await this.operation.execute({
      principal,
      items: body.items,
    });
    return result.fold((results) => ({ results }), this.handleError);
  }
  private handleError(
    this: void,
    error:
      AppError<"forbidden"> | AppError<"validation"> | AppError<"not_found">,
  ): never {
    switch (error.code) {
      case "forbidden":
        throw new ProblemException(403, error);
      case "validation":
        throw new ProblemException(400, error);
      case "not_found":
        throw new ProblemException(404, error);
      default:
        return assertNever(error);
    }
  }
}
