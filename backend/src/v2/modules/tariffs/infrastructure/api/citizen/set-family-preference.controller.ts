// SPDX-License-Identifier: AGPL-3.0-or-later
import { Body, HttpCode, Put, UseGuards } from "@nestjs/common";
import { ApiOperation, ApiResponse } from "@nestjs/swagger";
import { V2Controller } from "../../../../../shared/infrastructure/api/v2-controller.decorator";
import { Commands } from "../../../../../shared/infrastructure/commands.locator";
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
import { SetFamilyPreference } from "../../../application/commands/set-family-preference.command";
import { FamilyPreferenceRequestDTO } from "../dto/family-preference.request.dto";
@V2Controller("citizen/category-preference")
@UseGuards(PrincipalGuard)
export class SetFamilyPreferenceController {
  private readonly operation;
  constructor(locator: Commands) {
    this.operation = locator.get(SetFamilyPreference);
  }
  @Put()
  @HttpCode(204)
  @ApiOperation({ summary: "SetFamilyPreference" })
  @ApiResponse({
    status: 204,
    description: "Successful operation",
  })
  async handle(
    @CurrentPrincipal() principal: Principal,
    @Body() body: FamilyPreferenceRequestDTO,
  ): Promise<void> {
    const result = await this.operation.execute({
      principal,
      prefersFamilyTariff: body.prefersFamilyTariff,
    });
    return result.fold(() => undefined, this.handleError);
  }
  private handleError(
    this: void,
    error: AppError<"forbidden"> | AppError<"not_found">,
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
