// SPDX-License-Identifier: AGPL-3.0-or-later
import { Post, Res } from "@nestjs/common";
import { ApiCreatedResponse, ApiOperation } from "@nestjs/swagger";
import type { Response } from "express";
import { V2Controller } from "../../../../../shared/infrastructure/api/v2-controller.decorator";
import { Commands } from "../../../../../shared/infrastructure/commands.locator";
import { ProblemException } from "../../../../../shared/infrastructure/api/problem";
import { OPERATOR_COOKIE } from "../../../../../shared/infrastructure/api/operator.guard";
import { assertNever } from "../../../../../shared/application/errors";
import {
  CreateOperatorSession,
  CreateOperatorSessionError,
} from "../../../application/commands/create-operator-session.command";
import { OperatorSessionResponseDTO } from "../dto/operator-session.response.dto";
@V2Controller("public/operator-sessions")
export class CreateOperatorSessionController {
  private readonly operation;
  constructor(commands: Commands) {
    this.operation = commands.get(CreateOperatorSession);
  }
  @Post()
  @ApiOperation({
    summary:
      "Open a demo operator session; explicitly disabled unless DEMO_MODE=true",
  })
  @ApiCreatedResponse({ type: OperatorSessionResponseDTO })
  async handle(@Res({ passthrough: true }) response: Response) {
    return (await this.operation.execute({})).fold((value) => {
      response.cookie(OPERATOR_COOKIE, value.token, {
        httpOnly: true,
        sameSite: "strict",
        secure: process.env.NODE_ENV === "production",
        maxAge: 8 * 60 * 60 * 1000,
        path: "/",
      });
      return OperatorSessionResponseDTO.from(value.principal);
    }, this.handleError);
  }
  private handleError(this: void, error: CreateOperatorSessionError): never {
    switch (error.code) {
      case "demo_disabled":
        throw new ProblemException(403, error);
      case "not_found":
        throw new ProblemException(404, error);
      default:
        return assertNever(error);
    }
  }
}
