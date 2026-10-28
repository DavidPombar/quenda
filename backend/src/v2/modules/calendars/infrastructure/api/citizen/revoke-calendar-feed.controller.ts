// SPDX-License-Identifier: AGPL-3.0-or-later
import { Delete, HttpCode, UseGuards } from "@nestjs/common";
import { ApiNoContentResponse, ApiOperation } from "@nestjs/swagger";
import { V2Controller } from "../../../../../shared/infrastructure/api/v2-controller.decorator";
import { Commands } from "../../../../../shared/infrastructure/commands.locator";
import {
  PrincipalGuard,
  CurrentPrincipal,
} from "../../../../../shared/infrastructure/api/principal.guard";
import { Principal } from "../../../../../shared/application/principal";
import { ProblemException } from "../../../../../shared/infrastructure/api/problem";
import { AppError } from "../../../../../shared/application/errors";
import { RevokeCalendarFeed } from "../../../application/commands/revoke-calendar-feed.command";
@V2Controller("citizen/calendar-feed")
@UseGuards(PrincipalGuard)
export class RevokeCalendarFeedController {
  private readonly operation;
  constructor(locator: Commands) {
    this.operation = locator.get(RevokeCalendarFeed);
  }
  @Delete()
  @HttpCode(204)
  @ApiOperation({ summary: "Revoke the subscription link" })
  @ApiNoContentResponse({ description: "Link revoked" })
  async handle(@CurrentPrincipal() principal: Principal): Promise<void> {
    const result = await this.operation.execute({ principal });
    return result.fold(() => undefined, this.handleError);
  }
  private handleError(this: void, error: AppError<"forbidden">): never {
    throw new ProblemException(403, error);
  }
}
