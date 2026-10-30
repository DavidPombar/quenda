// SPDX-License-Identifier: AGPL-3.0-or-later
import { Delete, HttpCode, Param, UseGuards } from "@nestjs/common";
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
import { RemoveRepresentative } from "../../../application/commands/remove-representative.command";
import { RepresentativePathRequestDTO } from "../dto/representative-path.request.dto";
@V2Controller("manager/organizations")
@UseGuards(PrincipalGuard)
export class RemoveRepresentativeController {
  private readonly operation;
  constructor(locator: Commands) {
    this.operation = locator.get(RemoveRepresentative);
  }
  @Delete(":id/representatives/:userId")
  @HttpCode(204)
  @ApiOperation({ summary: "RemoveRepresentative" })
  @ApiResponse({ status: 204 })
  async handle(
    @CurrentPrincipal() principal: Principal,
    @Param() path: RepresentativePathRequestDTO,
  ): Promise<void> {
    const result = await this.operation.execute({
      principal,
      organizationId: path.id,
      userId: path.userId,
    });
    return result.fold(() => undefined, this.handleError);
  }
  private handleError(
    this: void,
    error: AppError<"forbidden"> | AppError<"not_found">,
  ): never {
    switch (error.code) {
      case "forbidden":
        throw new ProblemException(403, error);
      case "not_found":
        throw new ProblemException(404, error);
      default:
        return assertNever(error);
    }
  }
}
