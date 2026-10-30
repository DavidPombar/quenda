// SPDX-License-Identifier: AGPL-3.0-or-later
import { Get, UseGuards } from "@nestjs/common";
import { ApiOperation, ApiResponse } from "@nestjs/swagger";
import { V2Controller } from "../../../../../shared/infrastructure/api/v2-controller.decorator";
import {
  PrincipalGuard,
  CurrentPrincipal,
} from "../../../../../shared/infrastructure/api/principal.guard";
import { Principal } from "../../../../../shared/application/principal";
import { ProblemException } from "../../../../../shared/infrastructure/api/problem";
import { assertNever } from "../../../../../shared/application/errors";
import { Queries } from "../../../../../shared/infrastructure/queries.locator";
import {
  GetNotificationPreferences,
  GetNotificationPreferencesError,
} from "../../../application/queries/get-notification-preferences.query";
import { NotificationPreferencesResponseDTO } from "../dto/notification-preferences.response.dto";
@V2Controller("citizen/me/notification-preferences")
@UseGuards(PrincipalGuard)
export class GetNotificationPreferencesController {
  private readonly operation;
  constructor(locator: Queries) {
    this.operation = locator.get(GetNotificationPreferences);
  }
  @Get()
  @ApiOperation({ summary: "GetNotificationPreferences" })
  @ApiResponse({
    status: 200,
    description: "Successful operation",
    type: NotificationPreferencesResponseDTO,
    isArray: false,
  })
  async handle(
    @CurrentPrincipal() principal: Principal,
  ): Promise<NotificationPreferencesResponseDTO> {
    const result = await this.operation.execute({ principal });
    return result.fold(
      NotificationPreferencesResponseDTO.from,
      this.handleError,
    );
  }
  private handleError(
    this: void,
    error: GetNotificationPreferencesError,
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
