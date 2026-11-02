// SPDX-License-Identifier: AGPL-3.0-or-later
import { Get, Param, UseGuards } from "@nestjs/common";
import { ApiOperation, ApiResponse } from "@nestjs/swagger";
import { V2Controller } from "../../../../../shared/infrastructure/api/v2-controller.decorator";
import { Queries } from "../../../../../shared/infrastructure/queries.locator";
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
import { GetManagedActivity } from "../../../application/queries/get-managed-activity.query";
import { ManagedActivityDetailsResponseDTO } from "../dto/activity.response.dto";
import { IdPathRequestDTO } from "../dto/id-path.request.dto";
@V2Controller("manager/activities")
@UseGuards(PrincipalGuard)
export class GetManagedActivityController {
  private readonly operation;
  constructor(locator: Queries) {
    this.operation = locator.get(GetManagedActivity);
  }
  @Get(":id")
  @ApiOperation({ summary: "GetManagedActivity" })
  @ApiResponse({ status: 200, type: ManagedActivityDetailsResponseDTO })
  async handle(
    @CurrentPrincipal() principal: Principal,
    @Param() path: IdPathRequestDTO,
  ): Promise<ManagedActivityDetailsResponseDTO> {
    const result = await this.operation.execute({ principal, id: path.id });
    return result.fold(ManagedActivityDetailsResponseDTO.from, this.handleError);
  }
  private handleError(
    this: void,
    error: AppError<"forbidden"> | AppError<"not_found">,
  ): never {
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
