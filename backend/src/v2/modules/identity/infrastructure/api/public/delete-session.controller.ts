// SPDX-License-Identifier: AGPL-3.0-or-later
import { Delete, HttpCode, Req, Res } from "@nestjs/common";
import { ApiNoContentResponse } from "@nestjs/swagger";
import type { Request, Response } from "express";
import { V2Controller } from "../../../../../shared/infrastructure/api/v2-controller.decorator";
import { Commands } from "../../../../../shared/infrastructure/commands.locator";
import { sessionToken } from "../../../../../shared/infrastructure/api/principal.guard";
import { DeleteSession } from "../../../application/commands/delete-session.command";
@V2Controller("public/session")
export class DeleteSessionController {
  private readonly operation;
  constructor(commands: Commands) {
    this.operation = commands.get(DeleteSession);
  }
  @Delete()
  @HttpCode(204)
  @ApiNoContentResponse({ description: "Session revoked" })
  async handle(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.operation.execute({
      token: sessionToken(request),
    });
    return result.fold(
      () => {
        response.clearCookie("quenda_session", { path: "/" });
      },
      (error) => {
        throw new Error(String(error));
      },
    );
  }
}
