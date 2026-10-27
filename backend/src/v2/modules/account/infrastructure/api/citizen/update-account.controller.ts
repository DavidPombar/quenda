// SPDX-License-Identifier: AGPL-3.0-or-later
import { Body, HttpCode, Patch, UseGuards } from "@nestjs/common";
import { ApiOperation, ApiResponse } from "@nestjs/swagger";
import { V2Controller } from "../../../../../shared/infrastructure/api/v2-controller.decorator";
import { Commands } from "../../../../../shared/infrastructure/commands.locator";
import {
  UpdateAccount,
  UpdateAccountError,
} from "../../../application/commands/update-account.command";
import {
  PrincipalGuard,
  CurrentPrincipal,
} from "../../../../../shared/infrastructure/api/principal.guard";
import { Principal } from "../../../../../shared/application/principal";
import { ProblemException } from "../../../../../shared/infrastructure/api/problem";
import { assertNever } from "../../../../../shared/application/errors";
import { UpdateAccountRequestDTO } from "../dto/update-account.request.dto";
@V2Controller("citizen/me")
@UseGuards(PrincipalGuard)
export class UpdateAccountController {
  private readonly operation;
  constructor(locator: Commands) {
    this.operation = locator.get(UpdateAccount);
  }
  @Patch()
  @HttpCode(204)
  @ApiOperation({
    summary: "UpdateAccount",
    description: "Stores the language used for outgoing messages",
  })
  @ApiResponse({ status: 204, description: "Successful operation" })
  async handle(
    @CurrentPrincipal() principal: Principal,
    @Body() body: UpdateAccountRequestDTO,
  ): Promise<void> {
    const result = await this.operation.execute({
      principal,
      locale: body.locale,
    });
    return result.fold(() => undefined, this.handleError);
  }
  private handleError(this: void, error: UpdateAccountError): never {
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
