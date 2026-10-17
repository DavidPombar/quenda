// SPDX-License-Identifier: AGPL-3.0-or-later
import { Post, Body, UseGuards } from "@nestjs/common";
import { ApiOperation, ApiResponse } from "@nestjs/swagger";
import { V2Controller } from "../../../../../shared/infrastructure/api/v2-controller.decorator";
import { Commands } from "../../../../../shared/infrastructure/commands.locator";
import { SaveFacility } from "../../../application/commands/save-facility.command";
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
import { CreateFacilityRequestDTO } from "../dto/create-facility.request.dto";
import { FacilityResponseDTO } from "../dto/facility.response.dto";
@V2Controller("manager/facilities")
@UseGuards(PrincipalGuard)
export class CreateFacilityController {
  private readonly operation;
  constructor(locator: Commands) {
    this.operation = locator.get(SaveFacility);
  }
  @Post()
  @ApiOperation({ summary: "CreateFacility" })
  @ApiResponse({
    status: 201,
    description: "Successful operation",
    type: FacilityResponseDTO,
    isArray: false,
  })
  async handle(
    @CurrentPrincipal() principal: Principal,
    @Body() body: CreateFacilityRequestDTO,
  ): Promise<FacilityResponseDTO> {
    const result = await this.operation.execute({
      principal,
      id: body.id,
      patch: body,
      mode: "create",
    });
    return result.fold(FacilityResponseDTO.from, this.handleError);
  }
  private handleError(
    this: void,
    error:
      | AppError<"forbidden">
      | AppError<"not_found">
      | AppError<"validation">
      | AppError<"calendar_in_use">
      | AppError<"id_reused">,
  ): never {
    switch (error.code) {
      case "forbidden":
        throw new ProblemException(403, error);
      case "not_found":
        throw new ProblemException(404, error);
      case "validation":
        throw new ProblemException(400, error);
      case "calendar_in_use":
        throw new ProblemException(409, error);
      case "id_reused":
        throw new ProblemException(409, error);
      default:
        return assertNever(error);
    }
  }
}
