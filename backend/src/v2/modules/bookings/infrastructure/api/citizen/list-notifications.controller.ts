// SPDX-License-Identifier: AGPL-3.0-or-later
import { Get, UseGuards } from "@nestjs/common";
import { ApiOperation, ApiResponse } from "@nestjs/swagger";
import { V2Controller } from "../../../../../shared/infrastructure/api/v2-controller.decorator";
import { Queries } from "../../../../../shared/infrastructure/queries.locator";
import { ListNotifications } from "../../../application/queries/list-notifications.query";
import {
  PrincipalGuard,
  CurrentPrincipal,
} from "../../../../../shared/infrastructure/api/principal.guard";
import { Principal } from "../../../../../shared/application/principal";
import { ProblemException } from "../../../../../shared/infrastructure/api/problem";
import { AppError } from "../../../../../shared/application/errors";
import { NotificationResponseDTO } from "../dto/notification.response.dto";
@V2Controller("citizen/notifications")
@UseGuards(PrincipalGuard)
export class ListNotificationsController {
  private readonly operation;
  constructor(locator: Queries) {
    this.operation = locator.get(ListNotifications);
  }
  @Get()
  @ApiOperation({ summary: "ListNotifications" })
  @ApiResponse({
    status: 200,
    description: "Successful operation",
    type: NotificationResponseDTO,
    isArray: true,
  })
  async handle(
    @CurrentPrincipal() principal: Principal,
  ): Promise<NotificationResponseDTO[]> {
    const result = await this.operation.execute({ principal });
    return result.fold(
      (values) => values.map(NotificationResponseDTO.from),
      this.handleError,
    );
  }
  private handleError(this: void, error: AppError<"forbidden">): never {
    throw new ProblemException(403, error);
  }
}
