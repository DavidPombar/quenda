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
import {
  AppError,
  assertNever,
} from "../../../../../shared/application/errors";
import { GetMyCategories } from "../../../application/queries/get-my-categories.query";
import { MyCategoriesResponseDTO } from "../dto/my-categories.response.dto";
@V2Controller("citizen/categories")
@UseGuards(PrincipalGuard)
export class GetMyCategoriesController {
  private readonly operation;
  constructor(locator: Queries) {
    this.operation = locator.get(GetMyCategories);
  }
  @Get()
  @ApiOperation({ summary: "GetMyCategories" })
  @ApiResponse({
    status: 200,
    description: "Successful operation",
    type: MyCategoriesResponseDTO,
    isArray: false,
  })
  async handle(
    @CurrentPrincipal() principal: Principal,
  ): Promise<MyCategoriesResponseDTO> {
    const result = await this.operation.execute({
      principal,
    });
    return result.fold(MyCategoriesResponseDTO.from, this.handleError);
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
