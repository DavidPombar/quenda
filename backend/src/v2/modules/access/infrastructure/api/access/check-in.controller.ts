// SPDX-License-Identifier: AGPL-3.0-or-later
import { Body, HttpCode, Post, UseGuards } from "@nestjs/common";
import { ApiOkResponse, ApiOperation } from "@nestjs/swagger";
import { V2Controller } from "../../../../../shared/infrastructure/api/v2-controller.decorator";
import {
  PrincipalGuard,
  CurrentPrincipal,
} from "../../../../../shared/infrastructure/api/principal.guard";
import { Principal } from "../../../../../shared/application/principal";
import { ProblemException } from "../../../../../shared/infrastructure/api/problem";
import { assertNever } from "../../../../../shared/application/errors";
import { Commands } from "../../../../../shared/infrastructure/commands.locator";
import {
  CheckIn,
  CheckInError,
} from "../../../application/commands/check-in.command";
import { CheckInRequestDTO } from "../dto/check-in.request.dto";
import { CheckInResponseDTO } from "../dto/check-in.response.dto";
@V2Controller("access/check-ins")
@UseGuards(PrincipalGuard)
export class CheckInController {
  private readonly operation;
  constructor(commands: Commands) {
    this.operation = commands.get(CheckIn);
  }
  @Post()
  @HttpCode(200)
  @ApiOperation({ summary: "CheckIn" })
  @ApiOkResponse({ type: CheckInResponseDTO })
  async handle(
    @CurrentPrincipal() principal: Principal,
    @Body() body: CheckInRequestDTO,
  ): Promise<CheckInResponseDTO> {
    return (
      await this.operation.execute({
        principal,
        token: body.token,
        scannedAt: body.scannedAt,
      })
    ).fold(CheckInResponseDTO.from, this.handleError);
  }
  private handleError(this: void, error: CheckInError): never {
    switch (error.code) {
      case "forbidden":
        throw new ProblemException(403, error);
      case "not_found":
        throw new ProblemException(404, error);
      case "validation":
        throw new ProblemException(400, error);
      case "invalid_credential":
      case "credential_not_yet_valid":
      case "credential_expired":
      case "booking_cancelled":
      case "marked_no_show":
        throw new ProblemException(422, error);
      default:
        return assertNever(error);
    }
  }
}
