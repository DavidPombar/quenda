// SPDX-License-Identifier: AGPL-3.0-or-later
import { Delete, HttpCode, Res, UseGuards } from "@nestjs/common";
import { ApiOperation, ApiResponse } from "@nestjs/swagger";
import type { Response } from "express";
import { V2Controller } from "../../../../../shared/infrastructure/api/v2-controller.decorator";
import { Commands } from "../../../../../shared/infrastructure/commands.locator";
import {
  DeleteAccount,
  DeleteAccountError,
} from "../../../application/commands/delete-account.command";
import {
  PrincipalGuard,
  CurrentPrincipal,
} from "../../../../../shared/infrastructure/api/principal.guard";
import { Principal } from "../../../../../shared/application/principal";
import { ProblemException } from "../../../../../shared/infrastructure/api/problem";
import { assertNever } from "../../../../../shared/application/errors";
@V2Controller("citizen/me")
@UseGuards(PrincipalGuard)
export class DeleteAccountController {
  private readonly operation;
  constructor(locator: Commands) {
    this.operation = locator.get(DeleteAccount);
  }
  @Delete()
  @HttpCode(204)
  @ApiOperation({
    summary: "DeleteAccount",
    description:
      "Right to erasure: anonymises the account, cancels upcoming reservations and revokes every session",
  })
  @ApiResponse({ status: 204, description: "Successful operation" })
  async handle(
    @CurrentPrincipal() principal: Principal,
    @Res({ passthrough: true }) response: Response,
  ): Promise<void> {
    const result = await this.operation.execute({ principal });
    return result.fold(() => {
      response.clearCookie("quenda_session", { path: "/" });
    }, this.handleError);
  }
  private handleError(this: void, error: DeleteAccountError): never {
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
