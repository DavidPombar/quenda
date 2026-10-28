// SPDX-License-Identifier: AGPL-3.0-or-later
import { Delete, HttpCode, Param, UseGuards } from "@nestjs/common";
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
import { RevokeCategory } from "../../../application/commands/revoke-category.command";
import { CitizenCategoryPathRequestDTO } from "../dto/citizen-category-path.request.dto";
@V2Controller("manager/citizens")
@UseGuards(PrincipalGuard)
export class RevokeCategoryController {
  private readonly operation;
  constructor(locator: Commands) {
    this.operation = locator.get(RevokeCategory);
  }
  @Delete(":userId/categories/:category")
  @HttpCode(204)
  @ApiOperation({ summary: "RevokeCategory" })
  @ApiResponse({
    status: 204,
    description: "Successful operation",
  })
  async handle(
    @CurrentPrincipal() principal: Principal,
    @Param() path: CitizenCategoryPathRequestDTO,
  ): Promise<void> {
    const result = await this.operation.execute({
      principal,
      userId: path.userId,
      category: path.category,
    });
    return result.fold(() => undefined, this.handleError);
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
