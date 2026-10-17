// SPDX-License-Identifier: AGPL-3.0-or-later
import { Get, Query } from "@nestjs/common";
import { ApiOperation, ApiResponse } from "@nestjs/swagger";
import { V2Controller } from "../../../../../shared/infrastructure/api/v2-controller.decorator";
import { Queries } from "../../../../../shared/infrastructure/queries.locator";
import { ListFacilities } from "../../../application/queries/list-facilities.query";
import { ProblemException } from "../../../../../shared/infrastructure/api/problem";
import { AppError } from "../../../../../shared/application/errors";
import { CatalogRequestDTO } from "../dto/catalog.request.dto";
import { FacilityResponseDTO } from "../dto/facility.response.dto";
@V2Controller("public/facilities")
export class ListFacilitiesController {
  private readonly operation;
  constructor(locator: Queries) {
    this.operation = locator.get(ListFacilities);
  }
  @Get()
  @ApiOperation({ summary: "ListFacilities" })
  @ApiResponse({
    status: 200,
    description: "Successful operation",
    type: FacilityResponseDTO,
    isArray: true,
  })
  async handle(
    @Query() query: CatalogRequestDTO,
  ): Promise<FacilityResponseDTO[]> {
    const result = await this.operation.execute({ slug: query.slug });
    return result.fold(
      (values) => values.map(FacilityResponseDTO.from),
      this.handleError,
    );
  }
  private handleError(this: void, error: AppError<"not_found">): never {
    throw new ProblemException(404, error);
  }
}
