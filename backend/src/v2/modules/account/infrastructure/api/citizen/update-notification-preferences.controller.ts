// SPDX-License-Identifier: AGPL-3.0-or-later
import { Body, HttpCode, Put, UseGuards } from "@nestjs/common";
import { ApiOperation, ApiResponse } from "@nestjs/swagger";
import { V2Controller } from "../../../../../shared/infrastructure/api/v2-controller.decorator";
import { Commands } from "../../../../../shared/infrastructure/commands.locator";
import {
  UpdateNotificationPreferences,
  UpdateNotificationPreferencesError,
} from "../../../application/commands/update-notification-preferences.command";
import {
  PrincipalGuard,
  CurrentPrincipal,
} from "../../../../../shared/infrastructure/api/principal.guard";
import { Principal } from "../../../../../shared/application/principal";
import { ProblemException } from "../../../../../shared/infrastructure/api/problem";
import { assertNever } from "../../../../../shared/application/errors";
import { NotificationPreferencesRequestDTO } from "../dto/notification-preferences.request.dto";
@V2Controller("citizen/me/notification-preferences")
@UseGuards(PrincipalGuard)
export class UpdateNotificationPreferencesController {
  private readonly operation;
  constructor(locator: Commands) {
    this.operation = locator.get(UpdateNotificationPreferences);
  }
  @Put()
  @HttpCode(204)
  @ApiOperation({ summary: "UpdateNotificationPreferences" })
  @ApiResponse({ status: 204, description: "Successful operation" })
  async handle(
    @CurrentPrincipal() principal: Principal,
    @Body() body: NotificationPreferencesRequestDTO,
  ): Promise<void> {
    const result = await this.operation.execute({
      principal,
      preferences: body,
    });
    return result.fold(() => undefined, this.handleError);
  }
  private handleError(
    this: void,
    error: UpdateNotificationPreferencesError,
  ): never {
    switch (error.code) {
      case "forbidden":
        throw new ProblemException(403, error);
      case "not_found":
        throw new ProblemException(404, error);
      default:
        return assertNever(error);
    }
  }
}
