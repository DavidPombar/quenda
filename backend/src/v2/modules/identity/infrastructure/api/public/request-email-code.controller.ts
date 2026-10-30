// SPDX-License-Identifier: AGPL-3.0-or-later
import { Body, HttpCode, Logger, Post } from "@nestjs/common";
import { ApiAcceptedResponse, ApiOperation } from "@nestjs/swagger";
import { V2Controller } from "../../../../../shared/infrastructure/api/v2-controller.decorator";
import { Commands } from "../../../../../shared/infrastructure/commands.locator";
import { ProblemException } from "../../../../../shared/infrastructure/api/problem";
import { SensitiveEndpoint } from "../../../../../shared/infrastructure/api/rate-limit";
import { assertNever } from "../../../../../shared/application/errors";
import {
  RequestEmailCode,
  RequestEmailCodeError,
} from "../../../application/commands/request-email-code.command";
import { LoginCodeSender } from "../../mail/login-code-sender";
import { RequestEmailCodeRequestDTO } from "../dto/request-email-code.request.dto";
@V2Controller("public/auth/email/codes")
export class RequestEmailCodeController {
  private readonly logger = new Logger(RequestEmailCodeController.name);
  private readonly operation;
  constructor(
    commands: Commands,
    private readonly sender: LoginCodeSender,
  ) {
    this.operation = commands.get(RequestEmailCode);
  }
  @Post()
  @HttpCode(202)
  @SensitiveEndpoint()
  @ApiOperation({
    summary:
      "Mails a one-time sign-in code; the answer never says whether an account exists",
  })
  @ApiAcceptedResponse({ description: "Accepted" })
  async handle(@Body() body: RequestEmailCodeRequestDTO): Promise<void> {
    const result = await this.operation.execute({
      slug: body.slug,
      email: body.email,
      legalVersion: body.legalVersion,
      locale: body.locale,
    });
    const codeId = result.fold((value) => value.codeId, this.handleError);
    // Sent after the commit; a failure is retried by the delivery worker.
    if (codeId)
      await this.sender.send(codeId).catch((error: unknown) => {
        this.logger.warn(`login code left for the worker: ${String(error)}`);
      });
  }
  private handleError(this: void, error: RequestEmailCodeError): never {
    switch (error.code) {
      case "email_login_disabled":
        throw new ProblemException(403, error);
      case "not_found":
        throw new ProblemException(404, error);
      case "validation":
        throw new ProblemException(400, error);
      case "consent_required":
        throw new ProblemException(422, error);
      default:
        return assertNever(error);
    }
  }
}
