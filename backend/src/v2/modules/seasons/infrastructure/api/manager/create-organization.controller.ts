// SPDX-License-Identifier: AGPL-3.0-or-later
import { Body, HttpCode, Post, UseGuards } from "@nestjs/common";
import { ApiOperation, ApiResponse } from "@nestjs/swagger";
import { V2Controller } from "../../../../../shared/infrastructure/api/v2-controller.decorator";
import { Commands } from "../../../../../shared/infrastructure/commands.locator";
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
import { CreateOrganization } from "../../../application/commands/create-organization.command";
import { OrganizationRequestDTO } from "../dto/organization.request.dto";
import { CreatedResponseDTO } from "../dto/created.response.dto";
@V2Controller("manager/organizations")
@UseGuards(PrincipalGuard)
export class CreateOrganizationController {
  private readonly operation;
  constructor(locator: Commands) {
    this.operation = locator.get(CreateOrganization);
  }
  @Post()
  @HttpCode(201)
  @ApiOperation({ summary: "CreateOrganization" })
  @ApiResponse({ status: 201, type: CreatedResponseDTO })
  async handle(
    @CurrentPrincipal() principal: Principal,
    @Body() body: OrganizationRequestDTO,
  ): Promise<CreatedResponseDTO> {
    const result = await this.operation.execute({ principal, input: body });
    return result.fold((value) => value, this.handleError);
  }
  private handleError(
    this: void,
    error: AppError<"forbidden"> | AppError<"validation">,
  ): never {
    switch (error.code) {
      case "forbidden":
        throw new ProblemException(403, error);
      case "validation":
        throw new ProblemException(400, error);
      default:
        return assertNever(error);
    }
  }
}
