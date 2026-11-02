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
import { CreateActivity } from "../../../application/commands/create-activity.command";
import { ActivityRequestDTO } from "../dto/activity.request.dto";
import { ManagedActivityDetailsResponseDTO } from "../dto/activity.response.dto";
import { activityProblem } from "../activity-problem";
@V2Controller("manager/activities")
@UseGuards(PrincipalGuard)
export class CreateActivityController {
  private readonly operation;
  constructor(locator: Commands) {
    this.operation = locator.get(CreateActivity);
  }
  @Post()
  @HttpCode(201)
  @ApiOperation({
    summary: "CreateActivity",
    description:
      "Saves a draft; 409 activity_conflict lists the dates that clash with the court",
  })
  @ApiResponse({ status: 201, type: ManagedActivityDetailsResponseDTO })
  async handle(
    @CurrentPrincipal() principal: Principal,
    @Body() body: ActivityRequestDTO,
  ): Promise<ManagedActivityDetailsResponseDTO> {
    const result = await this.operation.execute({ principal, input: body });
    return result.fold(ManagedActivityDetailsResponseDTO.from, activityProblem);
  }
}
