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
import { GetAccessSettings } from "../../../application/queries/get-access-settings.query";
import { AccessSettingsResponseDTO } from "../dto/access-settings.response.dto";
@V2Controller("manager/access-settings")
@UseGuards(PrincipalGuard)
export class GetAccessSettingsController {
  private readonly operation;
  constructor(locator: Queries) {
    this.operation = locator.get(GetAccessSettings);
  }
  @Get()
  @ApiOperation({ summary: "GetAccessSettings" })
  @ApiResponse({ status: 200, type: AccessSettingsResponseDTO })
  async handle(
    @CurrentPrincipal() principal: Principal,
  ): Promise<AccessSettingsResponseDTO> {
    const result = await this.operation.execute({ principal });
    return result.fold(AccessSettingsResponseDTO.from, (error) => {
      throw new ProblemException(403, error);
    });
  }
}
