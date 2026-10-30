// SPDX-License-Identifier: AGPL-3.0-or-later
import { Get, Query } from "@nestjs/common";
import { ApiOperation, ApiResponse } from "@nestjs/swagger";
import { V2Controller } from "../../../../../shared/infrastructure/api/v2-controller.decorator";
import { Queries } from "../../../../../shared/infrastructure/queries.locator";
import { ListFacilities } from "../../../application/queries/list-facilities.query";
import { ProblemException } from "../../../../../shared/infrastructure/api/problem";
import { AppError } from "../../../../../shared/application/errors";
import { DEFAULT_PAGE_SIZE } from "../../../domain/facility.repository";
import { ListFacilitiesRequestDTO } from "../dto/list-facilities.request.dto";
import { FacilityPageResponseDTO } from "../dto/facility-page.response.dto";
@V2Controller("public/facilities")
export class ListFacilitiesController {
  private readonly operation;
  constructor(locator: Queries) {
    this.operation = locator.get(ListFacilities);
  }
  @Get()
  @ApiOperation({
    summary:
      "One page of a municipality's facilities, filtered by text, sport, access and status",
  })
  @ApiResponse({
    status: 200,
    description: "Successful operation",
    type: FacilityPageResponseDTO,
  })
  async handle(
    @Query() query: ListFacilitiesRequestDTO,
  ): Promise<FacilityPageResponseDTO> {
    const result = await this.operation.execute({
      slug: query.slug,
      filters: {
        q: query.q,
        sport: query.sport,
        accessible:
          query.accessible === undefined
            ? undefined
            : query.accessible === "true",
        hideClosed: query.hideClosed === "true",
      },
      page: {
        page: query.page ?? 1,
        size: query.pageSize ?? DEFAULT_PAGE_SIZE,
      },
    });
    return result.fold(FacilityPageResponseDTO.from, this.handleError);
  }
  private handleError(this: void, error: AppError<"not_found">): never {
    throw new ProblemException(404, error);
  }
}
