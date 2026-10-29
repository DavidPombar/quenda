// SPDX-License-Identifier: AGPL-3.0-or-later
import { Get, UseGuards } from "@nestjs/common";
import { ApiOperation, ApiResponse } from "@nestjs/swagger";
import { V2Controller } from "../../../../../shared/infrastructure/api/v2-controller.decorator";
import { Queries } from "../../../../../shared/infrastructure/queries.locator";
import {
  PrincipalGuard,
  CurrentPrincipal,
} from "../../../../../shared/infrastructure/api/principal.guard";
import { Principal } from "../../../../../shared/application/principal";
import { ProblemException } from "../../../../../shared/infrastructure/api/problem";
import { AppError } from "../../../../../shared/application/errors";
import { GetMyClub } from "../../../application/queries/get-my-club.query";
import { MyClubResponseDTO } from "../dto/my-club.response.dto";
@V2Controller("citizen/me/club")
@UseGuards(PrincipalGuard)
export class GetMyClubController {
  private readonly operation;
  constructor(locator: Queries) {
    this.operation = locator.get(GetMyClub);
  }
  @Get()
  @ApiOperation({ summary: "GetMyClub" })
  @ApiResponse({ status: 200, type: MyClubResponseDTO })
  async handle(
    @CurrentPrincipal() principal: Principal,
  ): Promise<MyClubResponseDTO> {
    const result = await this.operation.execute({ principal });
    return result.fold(MyClubResponseDTO.from, this.handleError);
  }
  private handleError(this: void, error: AppError<"forbidden">): never {
    throw new ProblemException(403, error);
  }
}
