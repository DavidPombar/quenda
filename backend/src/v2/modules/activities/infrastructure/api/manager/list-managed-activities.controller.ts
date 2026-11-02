// SPDX-License-Identifier: AGPL-3.0-or-later
import { Get, UseGuards } from "@nestjs/common";
import { ApiOperation, ApiResponse } from "@nestjs/swagger";
import { V2Controller } from "../../../../../shared/infrastructure/api/v2-controller.decorator";
import { Queries } from "../../../../../shared/infrastructure/queries.locator";
import {
  PrincipalGuard,
  CurrentPrincipal,
} from "../../../../../shared/infrastructure/api/principal.guard";
import { Principal } from "../../../../../shared/application/principal";
import { ProblemException } from "../../../../../shared/infrastructure/api/problem";
import { AppError } from "../../../../../shared/application/errors";
import { ListManagedActivities } from "../../../application/queries/list-managed-activities.query";
import { ManagedActivityResponseDTO } from "../dto/activity.response.dto";
@V2Controller("manager/activities")
@UseGuards(PrincipalGuard)
export class ListManagedActivitiesController {
  private readonly operation;
  constructor(locator: Queries) {
    this.operation = locator.get(ListManagedActivities);
  }
  @Get()
  @ApiOperation({ summary: "ListManagedActivities" })
  @ApiResponse({ status: 200, type: [ManagedActivityResponseDTO] })
  async handle(
    @CurrentPrincipal() principal: Principal,
  ): Promise<ManagedActivityResponseDTO[]> {
    const result = await this.operation.execute({ principal });
    return result.fold(
      (items) => items.map(ManagedActivityResponseDTO.from),
      this.handleError,
    );
  }
  private handleError(this: void, error: AppError<"forbidden">): never {
    throw new ProblemException(403, error);
  }
}
