// SPDX-License-Identifier: AGPL-3.0-or-later
import { HttpCode, Param, Post, UseGuards } from "@nestjs/common";
import { ApiOperation, ApiResponse } from "@nestjs/swagger";
import { V2Controller } from "../../../../../shared/infrastructure/api/v2-controller.decorator";
import { Commands } from "../../../../../shared/infrastructure/commands.locator";
import {
  PrincipalGuard,
  CurrentPrincipal,
} from "../../../../../shared/infrastructure/api/principal.guard";
import { Principal } from "../../../../../shared/application/principal";
import { ProblemException } from "../../../../../shared/infrastructure/api/problem";
import { assertNever } from "../../../../../shared/application/errors";
import {
  IssueAccessPass,
  IssueAccessPassError,
} from "../../../application/commands/issue-access-pass.command";
import { AccessPassResponseDTO } from "../dto/access-pass.response.dto";
import { IdPathRequestDTO } from "../dto/id-path.request.dto";
@V2Controller("citizen/bookings")
@UseGuards(PrincipalGuard)
export class IssueAccessPassController {
  private readonly operation;
  constructor(locator: Commands) {
    this.operation = locator.get(IssueAccessPass);
  }
  @Post(":id/access-pass")
  @HttpCode(200)
  @ApiOperation({
    summary: "IssueAccessPass",
    description:
      "Signed QR pass for one of the person's confirmed reservations",
  })
  @ApiResponse({ status: 200, type: AccessPassResponseDTO })
  async handle(
    @CurrentPrincipal() principal: Principal,
    @Param() path: IdPathRequestDTO,
  ): Promise<AccessPassResponseDTO> {
    const result = await this.operation.execute({
      principal,
      bookingId: path.id,
    });
    return result.fold(AccessPassResponseDTO.from, this.handleError);
  }
  private handleError(this: void, error: IssueAccessPassError): never {
    switch (error.code) {
      case "forbidden":
        throw new ProblemException(403, error);
      case "not_found":
        throw new ProblemException(404, error);
      case "booking_cancelled":
        throw new ProblemException(422, error);
      case "validation":
        throw new ProblemException(422, error);
      default:
        return assertNever(error);
    }
  }
}
