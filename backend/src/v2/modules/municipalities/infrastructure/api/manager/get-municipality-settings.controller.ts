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
import { assertNever } from "../../../../../shared/application/errors";
import {
  GetMunicipalitySettings,
  GetMunicipalitySettingsError,
} from "../../../application/queries/get-municipality-settings.query";
import { MunicipalitySettingsResponseDTO } from "../dto/municipality-settings.response.dto";
@V2Controller("manager/municipality")
@UseGuards(PrincipalGuard)
export class GetMunicipalitySettingsController {
  private readonly operation;
  constructor(locator: Queries) {
    this.operation = locator.get(GetMunicipalitySettings);
  }
  @Get()
  @ApiOperation({ summary: "GetMunicipalitySettings" })
  @ApiOkResponse({ type: MunicipalitySettingsResponseDTO })
  async handle(
    @CurrentPrincipal() principal: Principal,
  ): Promise<MunicipalitySettingsResponseDTO> {
    return (await this.operation.execute({ principal })).fold(
      MunicipalitySettingsResponseDTO.fromSettings,
      this.handleError,
    );
  }
  private handleError(this: void, error: GetMunicipalitySettingsError): never {
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
