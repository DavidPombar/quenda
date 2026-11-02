// SPDX-License-Identifier: AGPL-3.0-or-later
import { Body, Param, Put, UseGuards } from "@nestjs/common";
import { ApiOperation, ApiResponse } from "@nestjs/swagger";
import { V2Controller } from "../../../../../shared/infrastructure/api/v2-controller.decorator";
import { Commands } from "../../../../../shared/infrastructure/commands.locator";
import {
  PrincipalGuard,
  CurrentPrincipal,
} from "../../../../../shared/infrastructure/api/principal.guard";
import { Principal } from "../../../../../shared/application/principal";
import { UpdateActivity } from "../../../application/commands/update-activity.command";
import { ActivityRequestDTO } from "../dto/activity.request.dto";
import { ManagedActivityDetailsResponseDTO } from "../dto/activity.response.dto";
import { IdPathRequestDTO } from "../dto/id-path.request.dto";
import { activityProblem } from "../activity-problem";
@V2Controller("manager/activities")
@UseGuards(PrincipalGuard)
export class UpdateActivityController {
  private readonly operation;
  constructor(locator: Commands) {
    this.operation = locator.get(UpdateActivity);
  }
  @Put(":id")
  @ApiOperation({
    summary: "UpdateActivity",
    description:
      "Replaces the activity; a published one gets new upcoming sessions, checked again",
  })
  @ApiResponse({ status: 200, type: ManagedActivityDetailsResponseDTO })
  async handle(
    @CurrentPrincipal() principal: Principal,
    @Param() path: IdPathRequestDTO,
    @Body() body: ActivityRequestDTO,
  ): Promise<ManagedActivityDetailsResponseDTO> {
    const result = await this.operation.execute({
      principal,
      id: path.id,
      input: body,
    });
    return result.fold(ManagedActivityDetailsResponseDTO.from, activityProblem);
  }
}
