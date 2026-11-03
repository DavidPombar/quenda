// SPDX-License-Identifier: AGPL-3.0-or-later
import { Body, Post, UseGuards } from "@nestjs/common";
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
  AddDependant,
  AddDependantError,
} from "../../../application/commands/add-dependant.command";
import { DependantRequestDTO } from "../dto/dependant.request.dto";
import { DependantResponseDTO } from "../dto/dependant.response.dto";
@V2Controller("citizen/dependants")
@UseGuards(PrincipalGuard)
export class AddDependantController {
  private readonly operation;
  constructor(locator: Commands) {
    this.operation = locator.get(AddDependant);
  }
  @Post()
  @ApiOperation({
    summary: "AddDependant",
    description:
      "Adds a person in the adult's care, by first name and year of birth, with the guardianship declaration",
  })
  @ApiResponse({ status: 201, type: DependantResponseDTO })
  async handle(
    @CurrentPrincipal() principal: Principal,
    @Body() body: DependantRequestDTO,
  ): Promise<DependantResponseDTO> {
    const result = await this.operation.execute({ principal, ...body });
    return result.fold(DependantResponseDTO.from, this.handleError);
  }
  private handleError(this: void, error: AddDependantError): never {
    switch (error.code) {
      case "forbidden":
        throw new ProblemException(403, error);
      case "not_found":
        throw new ProblemException(404, error);
      case "validation":
        throw new ProblemException(400, error);
      case "declaration_required":
      case "dependant_limit":
        throw new ProblemException(422, error);
      case "id_reused":
        throw new ProblemException(409, error);
      default:
        return assertNever(error);
    }
  }
}
