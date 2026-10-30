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
import { ListCampaigns } from "../../../application/queries/list-campaigns.query";
import { CampaignResponseDTO } from "../dto/campaign.response.dto";
@V2Controller("manager/season-campaigns")
@UseGuards(PrincipalGuard)
export class ListCampaignsController {
  private readonly operation;
  constructor(locator: Queries) {
    this.operation = locator.get(ListCampaigns);
  }
  @Get()
  @ApiOperation({ summary: "ListCampaigns" })
  @ApiResponse({ status: 200, type: CampaignResponseDTO, isArray: true })
  async handle(
    @CurrentPrincipal() principal: Principal,
  ): Promise<CampaignResponseDTO[]> {
    const result = await this.operation.execute({ principal });
    return result.fold(
      (values) => values.map(CampaignResponseDTO.from),
      this.handleError,
    );
  }
  private handleError(this: void, error: AppError<"forbidden">): never {
    throw new ProblemException(403, error);
  }
}
