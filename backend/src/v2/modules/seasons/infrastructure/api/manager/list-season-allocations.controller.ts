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
import {
  AppError,
  assertNever,
} from "../../../../../shared/application/errors";
import { ListSeasonAllocations } from "../../../application/queries/list-season-allocations.query";
import { AllocationResponseDTO } from "../dto/allocation.response.dto";
import { AllocationsQueryRequestDTO } from "../dto/allocations-query.request.dto";
@V2Controller("manager/season-allocations")
@UseGuards(PrincipalGuard)
export class ListSeasonAllocationsController {
  private readonly operation;
  constructor(locator: Queries) {
    this.operation = locator.get(ListSeasonAllocations);
  }
  @Get()
  @ApiOperation({ summary: "ListSeasonAllocations" })
  @ApiResponse({ status: 200, type: AllocationResponseDTO, isArray: true })
  async handle(
    @CurrentPrincipal() principal: Principal,
    @Query() query: AllocationsQueryRequestDTO,
  ): Promise<AllocationResponseDTO[]> {
    const result = await this.operation.execute({
      principal,
      campaignId: query.campaignId,
    });
    return result.fold(
      (values) => values.map(AllocationResponseDTO.from),
      this.handleError,
    );
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
