// SPDX-License-Identifier: AGPL-3.0-or-later
import { Body, Post, UseGuards } from "@nestjs/common";
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
import { RequestCategory } from "../../../application/commands/request-category.command";
import { RequestCategoryRequestDTO } from "../dto/request-category.request.dto";
import { UserCategoryResponseDTO } from "../dto/user-category.response.dto";
@V2Controller("citizen/categories")
@UseGuards(PrincipalGuard)
export class RequestCategoryController {
  private readonly operation;
  constructor(locator: Commands) {
    this.operation = locator.get(RequestCategory);
  }
  @Post()
  @ApiOperation({ summary: "RequestCategory" })
  @ApiResponse({
    status: 201,
    description: "Successful operation",
    type: UserCategoryResponseDTO,
    isArray: false,
  })
  async handle(
    @CurrentPrincipal() principal: Principal,
    @Body() body: RequestCategoryRequestDTO,
  ): Promise<UserCategoryResponseDTO> {
    const result = await this.operation.execute({
      principal,
      category: body.category,
    });
    return result.fold(UserCategoryResponseDTO.from, this.handleError);
  }
  private handleError(
    this: void,
    error:
      | AppError<"forbidden">
      | AppError<"not_found">
      | AppError<"category_not_enabled">
      | AppError<"category_already_requested">,
  ): never {
    switch (error.code) {
      case "forbidden":
        throw new ProblemException(403, error);
      case "not_found":
        throw new ProblemException(404, error);
      case "category_not_enabled":
        throw new ProblemException(422, error);
      case "category_already_requested":
        throw new ProblemException(409, error);
      default:
        return assertNever(error);
    }
  }
}
