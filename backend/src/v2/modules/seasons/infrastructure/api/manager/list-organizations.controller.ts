// SPDX-License-Identifier: AGPL-3.0-or-later
import { Get, UseGuards } from "@nestjs/common";
import { ApiOperation, ApiResponse } from "@nestjs/swagger";
import { V2Controller } from "../../../../../shared/infrastructure/api/v2-controller.decorator";
import { Queries } from "../../../../../shared/infrastructure/queries.locator";
import {
  PrincipalGuard,
  CurrentPrincipal,
} from "../../../../../shared/infrastructure/api/principal.guard";
import { Principal } from "../../../../../shared/application/principal";
import { ProblemException } from "../../../../../shared/infrastructure/api/problem";
import { AppError } from "../../../../../shared/application/errors";
import { ListOrganizations } from "../../../application/queries/list-organizations.query";
import { OrganizationResponseDTO } from "../dto/organization.response.dto";
@V2Controller("manager/organizations")
@UseGuards(PrincipalGuard)
export class ListOrganizationsController {
  private readonly operation;
  constructor(locator: Queries) {
    this.operation = locator.get(ListOrganizations);
  }
  @Get()
  @ApiOperation({ summary: "ListOrganizations" })
  @ApiResponse({ status: 200, type: OrganizationResponseDTO, isArray: true })
  async handle(
    @CurrentPrincipal() principal: Principal,
  ): Promise<OrganizationResponseDTO[]> {
    const result = await this.operation.execute({ principal });
    return result.fold(
      (values) => values.map(OrganizationResponseDTO.from),
      this.handleError,
    );
  }
  private handleError(this: void, error: AppError<"forbidden">): never {
    throw new ProblemException(403, error);
  }
}
