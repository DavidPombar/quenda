// SPDX-License-Identifier: AGPL-3.0-or-later
import { Body, HttpCode, Post, UseGuards } from "@nestjs/common";
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
import { SaveCampaign } from "../../../application/commands/save-campaign.command";
import { CampaignRequestDTO } from "../dto/campaign.request.dto";
import { CreatedResponseDTO } from "../dto/created.response.dto";
@V2Controller("manager/season-campaigns")
@UseGuards(PrincipalGuard)
export class CreateCampaignController {
  private readonly operation;
  constructor(locator: Commands) {
    this.operation = locator.get(SaveCampaign);
  }
  @Post()
  @HttpCode(201)
  @ApiOperation({ summary: "SaveCampaign" })
  @ApiResponse({ status: 201, type: CreatedResponseDTO })
  async handle(
    @CurrentPrincipal() principal: Principal,
    @Body() body: CampaignRequestDTO,
  ): Promise<CreatedResponseDTO> {
    const result = await this.operation.execute({ principal, input: body });
    return result.fold((value) => value, this.handleError);
  }
  private handleError(
    this: void,
    error:
      AppError<"forbidden"> | AppError<"not_found"> | AppError<"validation">,
  ): never {
    switch (error.code) {
      case "forbidden":
        throw new ProblemException(403, error);
      case "not_found":
        throw new ProblemException(404, error);
      case "validation":
        throw new ProblemException(400, error);
      default:
        return assertNever(error);
    }
  }
}
