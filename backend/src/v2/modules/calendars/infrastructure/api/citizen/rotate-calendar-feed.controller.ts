// SPDX-License-Identifier: AGPL-3.0-or-later
import { Post, UseGuards } from "@nestjs/common";
import { ApiCreatedResponse, ApiOperation } from "@nestjs/swagger";
import { V2Controller } from "../../../../../shared/infrastructure/api/v2-controller.decorator";
import { Commands } from "../../../../../shared/infrastructure/commands.locator";
import {
  PrincipalGuard,
  CurrentPrincipal,
} from "../../../../../shared/infrastructure/api/principal.guard";
import { Principal } from "../../../../../shared/application/principal";
import { ProblemException } from "../../../../../shared/infrastructure/api/problem";
import { AppError } from "../../../../../shared/application/errors";
import { RotateCalendarFeed } from "../../../application/commands/rotate-calendar-feed.command";
import { CalendarFeedLinkResponseDTO } from "../dto/calendar-feed-link.response.dto";
@V2Controller("citizen/calendar-feed")
@UseGuards(PrincipalGuard)
export class RotateCalendarFeedController {
  private readonly operation;
  constructor(locator: Commands) {
    this.operation = locator.get(RotateCalendarFeed);
  }
  @Post()
  @ApiOperation({
    summary: "Issue a new subscription link; the previous link stops working",
  })
  @ApiCreatedResponse({ type: CalendarFeedLinkResponseDTO })
  async handle(
    @CurrentPrincipal() principal: Principal,
  ): Promise<CalendarFeedLinkResponseDTO> {
    const result = await this.operation.execute({ principal });
    return result.fold(CalendarFeedLinkResponseDTO.from, this.handleError);
  }
  private handleError(this: void, error: AppError<"forbidden">): never {
    throw new ProblemException(403, error);
  }
}
