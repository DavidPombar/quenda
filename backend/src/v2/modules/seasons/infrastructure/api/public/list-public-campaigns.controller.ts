// SPDX-License-Identifier: AGPL-3.0-or-later
import { Get, Query } from "@nestjs/common";
import { ApiOperation, ApiResponse } from "@nestjs/swagger";
import { V2Controller } from "../../../../../shared/infrastructure/api/v2-controller.decorator";
import { Queries } from "../../../../../shared/infrastructure/queries.locator";
import { ProblemException } from "../../../../../shared/infrastructure/api/problem";
import { AppError } from "../../../../../shared/application/errors";
import { ListPublicCampaigns } from "../../../application/queries/list-public-campaigns.query";
import { CampaignResponseDTO } from "../dto/campaign.response.dto";
import { SlugQueryRequestDTO } from "../dto/slug-query.request.dto";
@V2Controller("public/season-campaigns")
export class ListPublicCampaignsController {
  private readonly operation;
  constructor(locator: Queries) {
    this.operation = locator.get(ListPublicCampaigns);
  }
  @Get()
  @ApiOperation({
    summary: "ListPublicCampaigns",
    description: "Open season campaigns with their published priority criteria",
  })
  @ApiResponse({ status: 200, type: CampaignResponseDTO, isArray: true })
  async handle(
    @Query() query: SlugQueryRequestDTO,
  ): Promise<CampaignResponseDTO[]> {
    const result = await this.operation.execute({ slug: query.slug });
    return result.fold(
      (values) => values.map(CampaignResponseDTO.from),
      this.handleError,
    );
  }
  private handleError(this: void, error: AppError<"not_found">): never {
    throw new ProblemException(404, error);
  }
}
