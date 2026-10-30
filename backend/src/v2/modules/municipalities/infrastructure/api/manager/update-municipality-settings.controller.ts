// SPDX-License-Identifier: AGPL-3.0-or-later
import { Body, Patch, UseGuards } from "@nestjs/common";
import { ApiOkResponse, ApiOperation } from "@nestjs/swagger";
import { V2Controller } from "../../../../../shared/infrastructure/api/v2-controller.decorator";
import { Commands } from "../../../../../shared/infrastructure/commands.locator";
import {
  PrincipalGuard,
  CurrentPrincipal,
} from "../../../../../shared/infrastructure/api/principal.guard";
import { Principal } from "../../../../../shared/application/principal";
import { ProblemException } from "../../../../../shared/infrastructure/api/problem";
import { assertNever } from "../../../../../shared/application/errors";
import {
  UpdateMunicipalitySettings,
  UpdateMunicipalitySettingsError,
} from "../../../application/commands/update-municipality-settings.command";
import { UpdateMunicipalitySettingsRequestDTO } from "../dto/update-municipality-settings.request.dto";
import { UpdateMunicipalitySettingsResponseDTO } from "../dto/update-municipality-settings.response.dto";
import { MunicipalitySettingsResponseDTO } from "../dto/municipality-settings.response.dto";
@V2Controller("manager/municipality")
@UseGuards(PrincipalGuard)
export class UpdateMunicipalitySettingsController {
  private readonly operation;
  constructor(locator: Commands) {
    this.operation = locator.get(UpdateMunicipalitySettings);
  }
  @Patch()
  @ApiOperation({ summary: "UpdateMunicipalitySettings" })
  @ApiOkResponse({ type: UpdateMunicipalitySettingsResponseDTO })
  async handle(
    @CurrentPrincipal() principal: Principal,
    @Body() body: UpdateMunicipalitySettingsRequestDTO,
  ): Promise<UpdateMunicipalitySettingsResponseDTO> {
    const result = await this.operation.execute({
      principal,
      patch: {
        ...body,
        legalTexts: body.legalTexts && {
          gl: body.legalTexts.gl,
          es: body.legalTexts.es,
        },
      },
    });
    return result.fold(
      (value) => ({
        settings: MunicipalitySettingsResponseDTO.fromSettings(value.settings),
        affectedBookings: value.affectedBookings,
      }),
      this.handleError,
    );
  }
  private handleError(
    this: void,
    error: UpdateMunicipalitySettingsError,
  ): never {
    switch (error.code) {
      case "forbidden":
        throw new ProblemException(403, error);
      case "not_found":
        throw new ProblemException(404, error);
      case "insufficient_contrast":
      case "invalid_holidays":
      case "invalid_analytics":
        throw new ProblemException(422, error);
      default:
        return assertNever(error);
    }
  }
}
