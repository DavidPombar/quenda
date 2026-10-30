// SPDX-License-Identifier: AGPL-3.0-or-later
import { Get, Param, Query } from "@nestjs/common";
import { ApiOperation, ApiResponse } from "@nestjs/swagger";
import { V2Controller } from "../../../../../shared/infrastructure/api/v2-controller.decorator";
import { Queries } from "../../../../../shared/infrastructure/queries.locator";
import { GetFacility } from "../../../application/queries/get-facility.query";
import { ProblemException } from "../../../../../shared/infrastructure/api/problem";
import { AppError } from "../../../../../shared/application/errors";
import { SlugRequestDTO } from "../dto/slug.request.dto";
import { IdPathRequestDTO } from "../dto/id-path.request.dto";
import { FacilityScheduleResponseDTO } from "../dto/facility-schedule.response.dto";
@V2Controller("public/facilities")
export class GetFacilityController {
  private readonly operation;
  constructor(locator: Queries) {
    this.operation = locator.get(GetFacility);
  }
  @Get(":id")
  @ApiOperation({
    summary: "Facility page with photos and the coming week's opening hours",
  })
  @ApiResponse({ status: 200, type: FacilityScheduleResponseDTO })
  async handle(
    @Param() path: IdPathRequestDTO,
    @Query() query: SlugRequestDTO,
  ): Promise<FacilityScheduleResponseDTO> {
    const result = await this.operation.execute({
      slug: query.slug,
      id: path.id,
    });
    return result.fold(
      FacilityScheduleResponseDTO.fromSchedule,
      this.handleError,
    );
  }
  private handleError(this: void, error: AppError<"not_found">): never {
    throw new ProblemException(404, error);
  }
}
