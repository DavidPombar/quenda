// SPDX-License-Identifier: AGPL-3.0-or-later
import { Body, HttpCode, Post, Res } from "@nestjs/common";
import { ApiOkResponse, ApiOperation } from "@nestjs/swagger";
import type { Response } from "express";
import { V2Controller } from "../../../../../shared/infrastructure/api/v2-controller.decorator";
import { Commands } from "../../../../../shared/infrastructure/commands.locator";
import { ProblemException } from "../../../../../shared/infrastructure/api/problem";
import { SensitiveEndpoint } from "../../../../../shared/infrastructure/api/rate-limit";
import { AppError, failure } from "../../../../../shared/application/errors";
import { CompleteTotpLogin } from "../../../application/commands/complete-totp-login.command";
import { TotpLoginRequestDTO } from "../dto/staff-login.request.dto";
import { SessionResponseDTO } from "../dto/session.response.dto";
import { OperatorSessionResponseDTO } from "../../../../operators/infrastructure/api/dto/operator-session.response.dto";
import { setOperatorCookie, setSessionCookie } from "./auth-cookies";
@V2Controller("public/auth/local/totp")
export class CompleteTotpLoginController {
  private readonly operation;
  constructor(commands: Commands) {
    this.operation = commands.get(CompleteTotpLogin);
  }
  @Post()
  @HttpCode(200)
  @SensitiveEndpoint()
  @ApiOperation({
    summary:
      "Local account: authenticator code; the first one confirms the second factor and the session opens",
  })
  @ApiOkResponse({ description: "Municipal or operator session" })
  async handle(
    @Body() body: TotpLoginRequestDTO,
    @Res({ passthrough: true }) response: Response,
  ): Promise<SessionResponseDTO | OperatorSessionResponseDTO> {
    return (
      await this.operation.execute({ ticket: body.ticket, code: body.code })
    ).fold((outcome) => {
      if ("rejected" in outcome)
        throw new ProblemException(
          outcome.rejected === "account_locked" ? 423 : 400,
          failure(outcome.rejected),
        );
      const session = outcome.signedIn;
      if (session.realm === "operator") {
        setOperatorCookie(response, session.token);
        return OperatorSessionResponseDTO.from(session.principal);
      }
      setSessionCookie(response, session.token);
      return SessionResponseDTO.from(session.principal);
    }, this.handleError);
  }
  private handleError(this: void, error: AppError<"login_expired">): never {
    throw new ProblemException(401, error);
  }
}
