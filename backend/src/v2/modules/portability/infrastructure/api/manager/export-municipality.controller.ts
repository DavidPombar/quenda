// SPDX-License-Identifier: AGPL-3.0-or-later
import { Get, Res, UseGuards } from "@nestjs/common";
import { ApiOkResponse, ApiOperation } from "@nestjs/swagger";
import type { Response } from "express";
import { V2Controller } from "../../../../../shared/infrastructure/api/v2-controller.decorator";
import {
  PrincipalGuard,
  CurrentPrincipal,
} from "../../../../../shared/infrastructure/api/principal.guard";
import { Principal } from "../../../../../shared/application/principal";
import { Commands } from "../../../../../shared/infrastructure/commands.locator";
import { ProblemException } from "../../../../../shared/infrastructure/api/problem";
import { assertNever } from "../../../../../shared/application/errors";
import {
  ExportMunicipality,
  ExportMunicipalityError,
} from "../../../application/commands/export-municipality.command";
import { MunicipalityExportResponseDTO } from "../dto/municipality-export.response.dto";
@V2Controller("manager/export")
@UseGuards(PrincipalGuard)
export class ExportMunicipalityController {
  private readonly operation;
  constructor(commands: Commands) {
    this.operation = commands.get(ExportMunicipality);
  }
  @Get()
  @ApiOperation({
    summary: "ExportMunicipality",
    description:
      "Complete data package of the signed-in manager's municipality in the open, versioned Quenda export format",
  })
  @ApiOkResponse({ type: MunicipalityExportResponseDTO })
  async handle(
    @CurrentPrincipal() principal: Principal,
    @Res({ passthrough: true }) response: Response,
  ) {
    const body = (await this.operation.execute({ principal })).fold(
      MunicipalityExportResponseDTO.from,
      this.handleError,
    );
    const date = body.exportedAt.slice(0, 10);
    response.setHeader(
      "Content-Disposition",
      `attachment; filename="quenda-${body.municipality.slug}-${date}.json"`,
    );
    return body;
  }
  private handleError(this: void, error: ExportMunicipalityError): never {
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
