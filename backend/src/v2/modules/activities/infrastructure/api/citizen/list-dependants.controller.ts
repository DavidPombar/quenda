// SPDX-License-Identifier: AGPL-3.0-or-later
import { Get, UseGuards } from "@nestjs/common";
import { ApiOperation, ApiResponse } from "@nestjs/swagger";
import { Queries } from "../../../../../shared/infrastructure/queries.locator";
import { V2Controller } from "../../../../../shared/infrastructure/api/v2-controller.decorator";
import {
  PrincipalGuard,
  CurrentPrincipal,
} from "../../../../../shared/infrastructure/api/principal.guard";
import { Principal } from "../../../../../shared/application/principal";
import { ProblemException } from "../../../../../shared/infrastructure/api/problem";
import { AppError } from "../../../../../shared/application/errors";
import { ListDependants } from "../../../application/queries/list-dependants.query";
import { DependantResponseDTO } from "../dto/dependant.response.dto";
@V2Controller("citizen/dependants")
@UseGuards(PrincipalGuard)
export class ListDependantsController {
  private readonly operation;
  constructor(locator: Queries) {
    this.operation = locator.get(ListDependants);
  }
  @Get()
  @ApiOperation({ summary: "ListDependants" })
  @ApiResponse({ status: 200, type: DependantResponseDTO, isArray: true })
  async handle(
    @CurrentPrincipal() principal: Principal,
  ): Promise<DependantResponseDTO[]> {
    const result = await this.operation.execute({ principal });
    return result.fold(
      (items) => items.map(DependantResponseDTO.from),
      this.handleError,
    );
  }
  private handleError(this: void, error: AppError<"forbidden">): never {
    throw new ProblemException(403, error);
  }
}
