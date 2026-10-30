// SPDX-License-Identifier: AGPL-3.0-or-later
import { Body, Post, Res } from "@nestjs/common";
import { ApiCreatedResponse, ApiOperation } from "@nestjs/swagger";
import type { Response } from "express";
import { V2Controller } from "../../../../../shared/infrastructure/api/v2-controller.decorator";
import { Commands } from "../../../../../shared/infrastructure/commands.locator";
import { ProblemException } from "../../../../../shared/infrastructure/api/problem";
import { SensitiveEndpoint } from "../../../../../shared/infrastructure/api/rate-limit";
import { assertNever, failure } from "../../../../../shared/application/errors";
import {
  VerifyEmailCode,
  VerifyEmailCodeError,
} from "../../../application/commands/verify-email-code.command";
import { VerifyEmailCodeRequestDTO } from "../dto/verify-email-code.request.dto";
import { SessionResponseDTO } from "../dto/session.response.dto";
import { setSessionCookie } from "./auth-cookies";
@V2Controller("public/auth/email/sessions")
export class VerifyEmailCodeController {
  private readonly operation;
  constructor(commands: Commands) {
    this.operation = commands.get(VerifyEmailCode);
  }
  @Post()
  @SensitiveEndpoint()
  @ApiOperation({ summary: "Opens a citizen session with the mailed code" })
  @ApiCreatedResponse({ type: SessionResponseDTO })
  async handle(
    @Body() body: VerifyEmailCodeRequestDTO,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.operation.execute({
      slug: body.slug,
      email: body.email,
      code: body.code,
    });
    return result.fold((outcome) => {
      if ("rejected" in outcome)
        throw new ProblemException(400, failure(outcome.rejected));
      setSessionCookie(response, outcome.signedIn.token);
      return SessionResponseDTO.from(outcome.signedIn.principal);
    }, this.handleError);
  }
  private handleError(this: void, error: VerifyEmailCodeError): never {
    switch (error.code) {
      case "email_login_disabled":
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
