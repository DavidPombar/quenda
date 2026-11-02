// SPDX-License-Identifier: AGPL-3.0-or-later
import { HttpCode, Param, Post, UseGuards } from "@nestjs/common";
import { ApiOperation, ApiResponse } from "@nestjs/swagger";
import { V2Controller } from "../../../../../shared/infrastructure/api/v2-controller.decorator";
import { Commands } from "../../../../../shared/infrastructure/commands.locator";
import {
  PrincipalGuard,
  CurrentPrincipal,
} from "../../../../../shared/infrastructure/api/principal.guard";
import { Principal } from "../../../../../shared/application/principal";
import { PublishActivity } from "../../../application/commands/publish-activity.command";
import { ManagedActivityDetailsResponseDTO } from "../dto/activity.response.dto";
import { IdPathRequestDTO } from "../dto/id-path.request.dto";
import { activityProblem } from "../activity-problem";
@V2Controller("manager/activities")
@UseGuards(PrincipalGuard)
export class PublishActivityController {
  private readonly operation;
  constructor(locator: Commands) {
    this.operation = locator.get(PublishActivity);
  }
  @Post(":id/publication")
  @HttpCode(200)
  @ApiOperation({
    summary: "PublishActivity",
    description:
      "Publishes a draft: its sessions occupy the court; 409 activity_conflict lists clashes",
  })
  @ApiResponse({ status: 200, type: ManagedActivityDetailsResponseDTO })
  async handle(
    @CurrentPrincipal() principal: Principal,
    @Param() path: IdPathRequestDTO,
  ): Promise<ManagedActivityDetailsResponseDTO> {
    const result = await this.operation.execute({ principal, id: path.id });
    return result.fold(ManagedActivityDetailsResponseDTO.from, activityProblem);
  }
}
