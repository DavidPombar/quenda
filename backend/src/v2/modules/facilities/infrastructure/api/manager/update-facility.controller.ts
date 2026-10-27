// SPDX-License-Identifier: AGPL-3.0-or-later
import { Patch, Body, Param, UseGuards, HttpCode } from "@nestjs/common";
import { ApiOperation, ApiResponse } from "@nestjs/swagger";
import { V2Controller } from "../../../../../shared/infrastructure/api/v2-controller.decorator";
import { Commands } from "../../../../../shared/infrastructure/commands.locator";
import { SaveFacility } from "../../../application/commands/save-facility.command";
import {
  PrincipalGuard,
  CurrentPrincipal,
} from "../../../../../shared/infrastructure/api/principal.guard";
import { Principal } from "../../../../../shared/application/principal";
import { ProblemException } from "../../../../../shared/infrastructure/api/problem";
import {
  AppError,
  assertNever,
} from "../../../../../shared/application/errors";
import { UpdateFacilityRequestDTO } from "../dto/update-facility.request.dto";
import { IdPathRequestDTO } from "../dto/id-path.request.dto";
@V2Controller("manager/facilities")
@UseGuards(PrincipalGuard)
export class UpdateFacilityController {
  private readonly operation;
  constructor(locator: Commands) {
    this.operation = locator.get(SaveFacility);
  }
  @Patch(":id")
  @HttpCode(204)
  @ApiOperation({ summary: "UpdateFacility" })
  @ApiResponse({ status: 204, description: "Successful operation" })
  async handle(
    @CurrentPrincipal() principal: Principal,
    @Param() path: IdPathRequestDTO,
    @Body() body: UpdateFacilityRequestDTO,
  ): Promise<void> {
    const { closureReason, ...patch } = body;
    const result = await this.operation.execute({
      principal,
      id: path.id,
      patch,
      mode: "update",
      closureReason,
    });
    return result.fold(() => undefined, this.handleError);
  }
  private handleError(
    this: void,
    error:
      | AppError<"forbidden">
      | AppError<"not_found">
      | AppError<"validation">
      | AppError<"calendar_in_use">
      | AppError<"id_reused">,
  ): never {
    switch (error.code) {
      case "forbidden":
        throw new ProblemException(403, error);
      case "not_found":
        throw new ProblemException(404, error);
      case "validation":
        throw new ProblemException(400, error);
      case "calendar_in_use":
        throw new ProblemException(409, error);
      case "id_reused":
        throw new ProblemException(409, error);
      default:
        return assertNever(error);
    }
  }
}
