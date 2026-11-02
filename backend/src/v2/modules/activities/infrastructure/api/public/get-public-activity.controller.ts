// SPDX-License-Identifier: AGPL-3.0-or-later
import { Get, Param, Query } from "@nestjs/common";
import { ApiOperation, ApiResponse } from "@nestjs/swagger";
import { V2Controller } from "../../../../../shared/infrastructure/api/v2-controller.decorator";
import { Queries } from "../../../../../shared/infrastructure/queries.locator";
import { ProblemException } from "../../../../../shared/infrastructure/api/problem";
import { AppError } from "../../../../../shared/application/errors";
import { GetPublicActivity } from "../../../application/queries/get-public-activity.query";
import { PublicActivityDetailsResponseDTO } from "../dto/activity.response.dto";
import { IdPathRequestDTO } from "../dto/id-path.request.dto";
import { SlugRequestDTO } from "../dto/slug.request.dto";
@V2Controller("public/activities")
export class GetPublicActivityController {
  private readonly operation;
  constructor(locator: Queries) {
    this.operation = locator.get(GetPublicActivity);
  }
  @Get(":id")
  @ApiOperation({
    summary: "A published activity with its upcoming sessions",
  })
  @ApiResponse({ status: 200, type: PublicActivityDetailsResponseDTO })
  async handle(
    @Param() path: IdPathRequestDTO,
    @Query() query: SlugRequestDTO,
  ): Promise<PublicActivityDetailsResponseDTO> {
    const result = await this.operation.execute({
      slug: query.slug,
      id: path.id,
    });
    return result.fold(PublicActivityDetailsResponseDTO.from, this.handleError);
  }
  private handleError(this: void, error: AppError<"not_found">): never {
    throw new ProblemException(404, error);
  }
}
