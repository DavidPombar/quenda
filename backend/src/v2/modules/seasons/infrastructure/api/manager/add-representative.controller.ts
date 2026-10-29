// SPDX-License-Identifier: AGPL-3.0-or-later
import { Body, HttpCode, Param, Post, UseGuards } from "@nestjs/common";
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
import { AddRepresentative } from "../../../application/commands/add-representative.command";
import { RepresentativeRequestDTO } from "../dto/representative.request.dto";
import { IdPathRequestDTO } from "../dto/id-path.request.dto";
@V2Controller("manager/organizations")
@UseGuards(PrincipalGuard)
export class AddRepresentativeController {
  private readonly operation;
  constructor(locator: Commands) {
    this.operation = locator.get(AddRepresentative);
  }
  @Post(":id/representatives")
  @HttpCode(201)
  @ApiOperation({
    summary: "AddRepresentative",
    description:
      "Links an existing citizen account (by email); a person represents a single club",
  })
  @ApiResponse({ status: 201 })
  async handle(
    @CurrentPrincipal() principal: Principal,
    @Param() path: IdPathRequestDTO,
    @Body() body: RepresentativeRequestDTO,
  ): Promise<{ userId: string }> {
    const result = await this.operation.execute({
      principal,
      organizationId: path.id,
      email: body.email,
    });
    return result.fold((value) => value, this.handleError);
  }
  private handleError(
    this: void,
    error:
      AppError<"forbidden"> | AppError<"not_found"> | AppError<"validation">,
  ): never {
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
