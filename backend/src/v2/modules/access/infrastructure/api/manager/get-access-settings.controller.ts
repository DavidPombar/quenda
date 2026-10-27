// SPDX-License-Identifier: AGPL-3.0-or-later
import { Get, UseGuards } from "@nestjs/common";
import { ApiOkResponse, ApiOperation } from "@nestjs/swagger";
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
  GetAccessSettings,
  GetAccessSettingsError,
} from "../../../application/queries/get-access-settings.query";
import { AccessSettingsResponseDTO } from "../dto/access-settings.response.dto";
@V2Controller("manager/access")
@UseGuards(PrincipalGuard)
export class GetAccessSettingsController {
  private readonly operation;
  constructor(queries: Queries) {
    this.operation = queries.get(GetAccessSettings);
  }
  @Get()
  @ApiOperation({ summary: "GetAccessSettings" })
  @ApiOkResponse({ type: AccessSettingsResponseDTO })
  async handle(
    @CurrentPrincipal() principal: Principal,
  ): Promise<AccessSettingsResponseDTO> {
    return (await this.operation.execute({ principal })).fold(
      AccessSettingsResponseDTO.from,
      this.handleError,
    );
  }
  private handleError(this: void, error: GetAccessSettingsError): never {
    switch (error.code) {
      case "forbidden":
        throw new ProblemException(403, error);
      default:
        return assertNever(error.code);
    }
  }
}
