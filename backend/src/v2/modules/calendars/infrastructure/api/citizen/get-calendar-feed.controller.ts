// SPDX-License-Identifier: AGPL-3.0-or-later
import { Get, UseGuards } from "@nestjs/common";
import { ApiOkResponse, ApiOperation } from "@nestjs/swagger";
import { V2Controller } from "../../../../../shared/infrastructure/api/v2-controller.decorator";
import { Queries } from "../../../../../shared/infrastructure/queries.locator";
import {
  PrincipalGuard,
  CurrentPrincipal,
} from "../../../../../shared/infrastructure/api/principal.guard";
import { Principal } from "../../../../../shared/application/principal";
import { ProblemException } from "../../../../../shared/infrastructure/api/problem";
import { AppError } from "../../../../../shared/application/errors";
import { GetCalendarFeed } from "../../../application/queries/get-calendar-feed.query";
import { CalendarFeedResponseDTO } from "../dto/calendar-feed.response.dto";
@V2Controller("citizen/calendar-feed")
@UseGuards(PrincipalGuard)
export class GetCalendarFeedController {
  private readonly operation;
  constructor(locator: Queries) {
    this.operation = locator.get(GetCalendarFeed);
  }
  @Get()
  @ApiOperation({ summary: "Subscription link status (never the secret)" })
  @ApiOkResponse({ type: CalendarFeedResponseDTO })
  async handle(
    @CurrentPrincipal() principal: Principal,
  ): Promise<CalendarFeedResponseDTO> {
    const result = await this.operation.execute({ principal });
    return result.fold(CalendarFeedResponseDTO.from, this.handleError);
  }
  private handleError(this: void, error: AppError<"forbidden">): never {
    throw new ProblemException(403, error);
  }
}
