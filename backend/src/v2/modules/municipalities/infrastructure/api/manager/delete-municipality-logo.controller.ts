// SPDX-License-Identifier: AGPL-3.0-or-later
import { Delete, HttpCode, UseGuards } from "@nestjs/common";
import { ApiOperation, ApiResponse } from "@nestjs/swagger";
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
  DeleteMunicipalityLogo,
  DeleteMunicipalityLogoError,
} from "../../../application/commands/delete-municipality-logo.command";
@V2Controller("manager/municipality/logo")
@UseGuards(PrincipalGuard)
export class DeleteMunicipalityLogoController {
  private readonly operation;
  constructor(locator: Commands) {
    this.operation = locator.get(DeleteMunicipalityLogo);
  }
  @Delete()
  @HttpCode(204)
  @ApiOperation({ summary: "DeleteMunicipalityLogo" })
  @ApiResponse({ status: 204, description: "Successful operation" })
  async handle(@CurrentPrincipal() principal: Principal): Promise<void> {
    return (await this.operation.execute({ principal })).fold(
      () => undefined,
      this.handleError,
    );
  }
  private handleError(this: void, error: DeleteMunicipalityLogoError): never {
    switch (error.code) {
      case "forbidden":
        throw new ProblemException(403, error);
      default:
        return assertNever(error.code);
    }
  }
}
