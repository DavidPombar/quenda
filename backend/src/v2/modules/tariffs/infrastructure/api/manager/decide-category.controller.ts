// SPDX-License-Identifier: AGPL-3.0-or-later
import { Body, Param, Put, UseGuards } from "@nestjs/common";
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
import { DecideCategory } from "../../../application/commands/decide-category.command";
import { CitizenCategoryPathRequestDTO } from "../dto/citizen-category-path.request.dto";
import { DecideCategoryRequestDTO } from "../dto/decide-category.request.dto";
import { UserCategoryResponseDTO } from "../dto/user-category.response.dto";
@V2Controller("manager/citizens")
@UseGuards(PrincipalGuard)
export class DecideCategoryController {
  private readonly operation;
  constructor(locator: Commands) {
    this.operation = locator.get(DecideCategory);
  }
  @Put(":userId/categories/:category")
  @ApiOperation({ summary: "DecideCategory" })
  @ApiResponse({
    status: 200,
    description: "Successful operation",
    type: UserCategoryResponseDTO,
    isArray: false,
  })
  async handle(
    @CurrentPrincipal() principal: Principal,
    @Param() path: CitizenCategoryPathRequestDTO,
    @Body() body: DecideCategoryRequestDTO,
  ): Promise<UserCategoryResponseDTO> {
    const result = await this.operation.execute({
      principal,
      userId: path.userId,
      category: path.category,
      status: body.status,
    });
    return result.fold(UserCategoryResponseDTO.from, this.handleError);
  }
  private handleError(
    this: void,
    error:
      | AppError<"forbidden">
      | AppError<"not_found">
      | AppError<"category_not_enabled">,
  ): never {
    switch (error.code) {
      case "forbidden":
        throw new ProblemException(403, error);
      case "not_found":
        throw new ProblemException(404, error);
      case "category_not_enabled":
        throw new ProblemException(422, error);
      default:
        return assertNever(error);
    }
  }
}
