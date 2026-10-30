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
import { Queries } from "../../../../../shared/infrastructure/queries.locator";
import { AppError } from "../../../../../shared/application/errors";
import { ListManagedSports } from "../../../application/queries/list-managed-sports.query";
import { SportResponseDTO } from "../dto/sport.response.dto";
@V2Controller("manager/sports")
@UseGuards(PrincipalGuard)
export class ListManagedSportsController {
  private readonly operation;
  constructor(locator: Queries) {
    this.operation = locator.get(ListManagedSports);
  }
  @Get()
  @ApiOperation({
    summary: "The municipality's sports catalogue, hidden ones included",
  })
  @ApiOkResponse({ type: SportResponseDTO, isArray: true })
  async handle(
    @CurrentPrincipal() principal: Principal,
  ): Promise<SportResponseDTO[]> {
    return (await this.operation.execute({ principal })).fold(
      (values) => values.map(SportResponseDTO.from),
      this.handleError,
    );
  }
  private handleError(this: void, error: AppError<"forbidden">): never {
    throw new ProblemException(403, error);
  }
}
