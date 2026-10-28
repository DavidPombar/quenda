// SPDX-License-Identifier: AGPL-3.0-or-later
import { Get, Query, UseGuards } from "@nestjs/common";
import { ApiOperation, ApiResponse } from "@nestjs/swagger";
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
  GetAccessDay,
  GetAccessDayError,
} from "../../../application/queries/get-access-day.query";
import { AccessDayResponseDTO } from "../dto/access-day.response.dto";
import { AccessDayQueryRequestDTO } from "../dto/access-day-query.request.dto";
@V2Controller("access/day")
@UseGuards(PrincipalGuard)
export class GetAccessDayController {
  private readonly operation;
  constructor(locator: Queries) {
    this.operation = locator.get(GetAccessDay);
  }
  @Get()
  @ApiOperation({
    summary: "GetAccessDay",
    description: "Keys, reservations and revocations for offline door checks",
  })
  @ApiResponse({ status: 200, type: AccessDayResponseDTO })
  async handle(
    @CurrentPrincipal() principal: Principal,
    @Query() query: AccessDayQueryRequestDTO,
  ): Promise<AccessDayResponseDTO> {
    const result = await this.operation.execute({
      principal,
      date: query.date,
    });
    return result.fold(AccessDayResponseDTO.from, this.handleError);
  }
  private handleError(this: void, error: GetAccessDayError): never {
    switch (error.code) {
      case "forbidden":
        throw new ProblemException(403, error);
      case "not_found":
        throw new ProblemException(404, error);
      case "validation":
        throw new ProblemException(400, error);
      default:
        return assertNever(error);
    }
  }
}
