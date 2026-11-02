// SPDX-License-Identifier: AGPL-3.0-or-later
import { Get, Query } from "@nestjs/common";
import { ApiOperation, ApiResponse } from "@nestjs/swagger";
import { V2Controller } from "../../../../../shared/infrastructure/api/v2-controller.decorator";
import { Queries } from "../../../../../shared/infrastructure/queries.locator";
import { ProblemException } from "../../../../../shared/infrastructure/api/problem";
import { AppError } from "../../../../../shared/application/errors";
import { ListPublicActivities } from "../../../application/queries/list-public-activities.query";
import { ACTIVITY_PAGE_SIZE } from "../../../domain/activity.repository";
import { ListActivitiesRequestDTO } from "../dto/list-activities.request.dto";
import { PublicActivityPageResponseDTO } from "../dto/activity.response.dto";
@V2Controller("public/activities")
export class ListPublicActivitiesController {
  private readonly operation;
  constructor(locator: Queries) {
    this.operation = locator.get(ListPublicActivities);
  }
  @Get()
  @ApiOperation({
    summary:
      "One page of a municipality's published activities, filtered by sport, facility, age and enrolment",
  })
  @ApiResponse({ status: 200, type: PublicActivityPageResponseDTO })
  async handle(
    @Query() query: ListActivitiesRequestDTO,
  ): Promise<PublicActivityPageResponseDTO> {
    const result = await this.operation.execute({
      slug: query.slug,
      filters: {
        sport: query.sport,
        facilityId: query.facility,
        age: query.age,
        openOnly: query.open === "true",
      },
      page: query.page ?? 1,
      pageSize: query.pageSize ?? ACTIVITY_PAGE_SIZE,
    });
    return result.fold(PublicActivityPageResponseDTO.from, this.handleError);
  }
  private handleError(this: void, error: AppError<"not_found">): never {
    throw new ProblemException(404, error);
  }
}
