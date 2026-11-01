// SPDX-License-Identifier: AGPL-3.0-or-later
import { HttpCode, Post, Req, Res } from "@nestjs/common";
import { ApiOkResponse, ApiOperation } from "@nestjs/swagger";
import type { Request, Response } from "express";
import { V2Controller } from "../../../../../shared/infrastructure/api/v2-controller.decorator";
import { Commands } from "../../../../../shared/infrastructure/commands.locator";
import { ProblemException } from "../../../../../shared/infrastructure/api/problem";
import { sessionToken } from "../../../../../shared/infrastructure/api/principal.guard";
import { ExtendSession } from "../../../application/commands/extend-session.command";
import { SessionExpiryResponseDTO } from "../dto/session-expiry.response.dto";
import { setSessionCookie } from "./auth-cookies";
@V2Controller("public/session/extension")
export class ExtendSessionController {
  private readonly operation;
  constructor(commands: Commands) {
    this.operation = commands.get(ExtendSession);
  }
  @Post()
  @HttpCode(200)
  @ApiOperation({
    summary: "Keep the current session open for another eight hours",
  })
  @ApiOkResponse({ type: SessionExpiryResponseDTO })
  async handle(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<SessionExpiryResponseDTO> {
    const token = sessionToken(request);
    return (await this.operation.execute({ token })).fold(
      (until) => {
        setSessionCookie(response, token);
        return { expiresAt: until.toString() };
      },
      (error) => {
        throw new ProblemException(401, error);
      },
    );
  }
}
