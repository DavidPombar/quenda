// SPDX-License-Identifier: AGPL-3.0-or-later
import { Body, Param, Patch, UseGuards } from "@nestjs/common";
import { ApiOperation, ApiResponse } from "@nestjs/swagger";
import { Commands } from "../../../../../shared/infrastructure/commands.locator";
import { V2Controller } from "../../../../../shared/infrastructure/api/v2-controller.decorator";
import {
  PrincipalGuard,
  CurrentPrincipal,
} from "../../../../../shared/infrastructure/api/principal.guard";
import { Principal } from "../../../../../shared/application/principal";
import { ProblemException } from "../../../../../shared/infrastructure/api/problem";
import { assertNever } from "../../../../../shared/application/errors";
import {
  UpdateDependant,
  UpdateDependantError,
} from "../../../application/commands/update-dependant.command";
import { DependantFieldsRequestDTO } from "../dto/dependant.request.dto";
import { DependantResponseDTO } from "../dto/dependant.response.dto";
import { IdPathRequestDTO } from "../dto/id-path.request.dto";
@V2Controller("citizen/dependants")
@UseGuards(PrincipalGuard)
export class UpdateDependantController {
  private readonly operation;
  constructor(locator: Commands) {
    this.operation = locator.get(UpdateDependant);
  }
  @Patch(":id")
  @ApiOperation({ summary: "UpdateDependant" })
  @ApiResponse({ status: 200, type: DependantResponseDTO })
  async handle(
    @CurrentPrincipal() principal: Principal,
    @Param() path: IdPathRequestDTO,
    @Body() body: DependantFieldsRequestDTO,
  ): Promise<DependantResponseDTO> {
    const result = await this.operation.execute({
      principal,
      id: path.id,
      ...body,
    });
    return result.fold(DependantResponseDTO.from, this.handleError);
  }
  private handleError(this: void, error: UpdateDependantError): never {
    switch (error.code) {
      case "forbidden":
        throw new ProblemException(403, error);
      case "not_found":
        throw new ProblemException(404, error);
      case "validation":
        throw new ProblemException(400, error);
      default:
        return assertNever(error);
    }
  }
}
