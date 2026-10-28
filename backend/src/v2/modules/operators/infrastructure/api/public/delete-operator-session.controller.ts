// SPDX-License-Identifier: AGPL-3.0-or-later
import { Delete, HttpCode, Req, Res } from "@nestjs/common";
import { ApiNoContentResponse } from "@nestjs/swagger";
import type { Request, Response } from "express";
import { V2Controller } from "../../../../../shared/infrastructure/api/v2-controller.decorator";
import { Commands } from "../../../../../shared/infrastructure/commands.locator";
import {
  OPERATOR_COOKIE,
  operatorSessionToken,
} from "../../../../../shared/infrastructure/api/operator.guard";
import { DeleteOperatorSession } from "../../../application/commands/delete-operator-session.command";
@V2Controller("public/operator-session")
export class DeleteOperatorSessionController {
  private readonly operation;
  constructor(commands: Commands) {
    this.operation = commands.get(DeleteOperatorSession);
  }
  @Delete()
  @HttpCode(204)
  @ApiNoContentResponse({ description: "Operator session revoked" })
  async handle(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    return (
      await this.operation.execute({ token: operatorSessionToken(request) })
    ).fold(
      () => {
        response.clearCookie(OPERATOR_COOKIE, { path: "/" });
      },
      (error) => {
        throw new Error(String(error));
      },
    );
  }
}
