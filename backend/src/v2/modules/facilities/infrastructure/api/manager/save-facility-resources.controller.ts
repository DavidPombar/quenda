// SPDX-License-Identifier: AGPL-3.0-or-later
import { Put, Body, Param, UseGuards } from "@nestjs/common";
import { ApiOperation, ApiResponse } from "@nestjs/swagger";
import { V2Controller } from "../../../../../shared/infrastructure/api/v2-controller.decorator";
import { Commands } from "../../../../../shared/infrastructure/commands.locator";
import { SaveFacilityResources } from "../../../application/commands/save-facility-resources.command";
import {
  PrincipalGuard,
  CurrentPrincipal,
} from "../../../../../shared/infrastructure/api/principal.guard";
import { Principal } from "../../../../../shared/application/principal";
import { ProblemException } from "../../../../../shared/infrastructure/api/problem";
import {
  AppError,
  assertNever,
} from "../../../../../shared/application/errors";
import { SaveResourcesRequestDTO } from "../dto/save-resources.request.dto";
import { ResourceResponseDTO } from "../dto/resource.response.dto";
import { IdPathRequestDTO } from "../dto/id-path.request.dto";
@V2Controller("manager/facilities")
@UseGuards(PrincipalGuard)
export class SaveFacilityResourcesController {
  private readonly operation;
  constructor(locator: Commands) {
    this.operation = locator.get(SaveFacilityResources);
  }
  @Put(":id/resources")
  @ApiOperation({
    summary: "SaveFacilityResources",
    description:
      "Replaces the facility's courts and spaces. Courts with upcoming reservations cannot be removed, taken out of service, moved or split (409 resource_in_use); courts with past reservations cannot be removed (409 resource_has_history).",
  })
  @ApiResponse({
    status: 200,
    description: "The saved courts, ordered by position and name",
    type: ResourceResponseDTO,
    isArray: true,
  })
  async handle(
    @CurrentPrincipal() principal: Principal,
    @Param() path: IdPathRequestDTO,
    @Body() body: SaveResourcesRequestDTO,
  ): Promise<ResourceResponseDTO[]> {
    const result = await this.operation.execute({
      principal,
      facilityId: path.id,
      resources: body.resources,
    });
    return result.fold(
      (resources) => resources.map(ResourceResponseDTO.from),
      this.handleError,
    );
  }
  private handleError(
    this: void,
    error:
      | AppError<"forbidden">
      | AppError<"not_found">
      | AppError<"validation">
      | AppError<"id_reused">
      | AppError<"resource_in_use">
      | AppError<"resource_has_history">,
  ): never {
    switch (error.code) {
      case "forbidden":
        throw new ProblemException(403, error);
      case "not_found":
        throw new ProblemException(404, error);
      case "validation":
        throw new ProblemException(400, error);
      case "id_reused":
      case "resource_in_use":
      case "resource_has_history":
        throw new ProblemException(409, error);
      default:
        return assertNever(error);
    }
  }
}
