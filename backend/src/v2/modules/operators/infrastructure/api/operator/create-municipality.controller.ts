// SPDX-License-Identifier: AGPL-3.0-or-later
import { Body, Post, UseGuards } from "@nestjs/common";
import { ApiCreatedResponse, ApiOperation } from "@nestjs/swagger";
import { V2Controller } from "../../../../../shared/infrastructure/api/v2-controller.decorator";
import { Commands } from "../../../../../shared/infrastructure/commands.locator";
import { ProblemException } from "../../../../../shared/infrastructure/api/problem";
import { assertNever } from "../../../../../shared/application/errors";
import {
  OperatorGuard,
  CurrentOperator,
} from "../../../../../shared/infrastructure/api/operator.guard";
import { OperatorPrincipal } from "../../../../../shared/application/operator-principal";
import {
  CreateMunicipality,
  CreateMunicipalityError,
} from "../../../application/commands/create-municipality.command";
import { CreateMunicipalityRequestDTO } from "../dto/create-municipality.request.dto";
import { MunicipalitySettingsResponseDTO } from "../../../../municipalities/infrastructure/api/dto/municipality-settings.response.dto";
@V2Controller("operator/municipalities")
@UseGuards(OperatorGuard)
export class CreateMunicipalityController {
  private readonly operation;
  constructor(commands: Commands) {
    this.operation = commands.get(CreateMunicipality);
  }
  @Post()
  @ApiOperation({ summary: "CreateMunicipality" })
  @ApiCreatedResponse({ type: MunicipalitySettingsResponseDTO })
  async handle(
    @CurrentOperator() principal: OperatorPrincipal,
    @Body() body: CreateMunicipalityRequestDTO,
  ) {
    const result = await this.operation.execute({
      principal,
      ...body,
      legalTexts: { gl: body.legalTexts.gl, es: body.legalTexts.es },
    });
    return result.fold(
      MunicipalitySettingsResponseDTO.fromSettings,
      this.handleError,
    );
  }
  private handleError(this: void, error: CreateMunicipalityError): never {
    switch (error.code) {
      case "forbidden":
        throw new ProblemException(403, error);
      case "validation":
        throw new ProblemException(400, error);
      case "slug_taken":
      case "id_reused":
        throw new ProblemException(409, error);
      default:
        return assertNever(error);
    }
  }
}
