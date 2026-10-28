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
import { ListCategoryRequests } from "../../../application/queries/list-category-requests.query";
import { CategoryRequestResponseDTO } from "../dto/category-request.response.dto";
@V2Controller("manager/category-requests")
@UseGuards(PrincipalGuard)
export class ListCategoryRequestsController {
  private readonly operation;
  constructor(locator: Queries) {
    this.operation = locator.get(ListCategoryRequests);
  }
  @Get()
  @ApiOperation({ summary: "ListCategoryRequests" })
  @ApiResponse({
    status: 200,
    description: "Successful operation",
    type: CategoryRequestResponseDTO,
    isArray: true,
  })
  async handle(
    @CurrentPrincipal() principal: Principal,
  ): Promise<CategoryRequestResponseDTO[]> {
    const result = await this.operation.execute({
      principal,
    });
    return result.fold(
      (values) => values.map(CategoryRequestResponseDTO.from),
      this.handleError,
    );
  }
  private handleError(this: void, error: AppError<"forbidden">): never {
    throw new ProblemException(403, error);
  }
}
