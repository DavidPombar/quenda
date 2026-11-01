// SPDX-License-Identifier: AGPL-3.0-or-later
import { HttpCode, Post, Req, Res } from "@nestjs/common";
import { ApiOkResponse, ApiOperation } from "@nestjs/swagger";
import type { Request, Response } from "express";
import { V2Controller } from "../../../../../shared/infrastructure/api/v2-controller.decorator";
import { Commands } from "../../../../../shared/infrastructure/commands.locator";
import { ProblemException } from "../../../../../shared/infrastructure/api/problem";
import {
  OPERATOR_COOKIE,
  operatorSessionToken,
} from "../../../../../shared/infrastructure/api/operator.guard";
import { ExtendOperatorSession } from "../../../application/commands/extend-operator-session.command";
import { OperatorSessionExpiryResponseDTO } from "../dto/operator-session.response.dto";
@V2Controller("public/operator-session/extension")
export class ExtendOperatorSessionController {
  private readonly operation;
  constructor(commands: Commands) {
    this.operation = commands.get(ExtendOperatorSession);
  }
  @Post()
  @HttpCode(200)
  @ApiOperation({
    summary: "Keep the operator session open for another eight hours",
  })
  @ApiOkResponse({ type: OperatorSessionExpiryResponseDTO })
  async handle(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<OperatorSessionExpiryResponseDTO> {
    const token = operatorSessionToken(request);
    return (await this.operation.execute({ token })).fold(
      (until) => {
        response.cookie(OPERATOR_COOKIE, token, {
          httpOnly: true,
          sameSite: "strict",
          secure: process.env.NODE_ENV === "production",
          maxAge: 8 * 60 * 60 * 1000,
          path: "/",
        });
        return { expiresAt: until.toString() };
      },
      (error) => {
        throw new ProblemException(401, error);
      },
    );
  }
}
