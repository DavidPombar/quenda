// SPDX-License-Identifier: AGPL-3.0-or-later
import { Body, HttpCode, Post } from "@nestjs/common";
import { ApiOkResponse, ApiOperation } from "@nestjs/swagger";
import { V2Controller } from "../../../../../shared/infrastructure/api/v2-controller.decorator";
import { Commands } from "../../../../../shared/infrastructure/commands.locator";
import { ProblemException } from "../../../../../shared/infrastructure/api/problem";
import { SensitiveEndpoint } from "../../../../../shared/infrastructure/api/rate-limit";
import { assertNever, failure } from "../../../../../shared/application/errors";
import {
  StaffLoginError,
  StartPasswordLogin,
} from "../../../application/commands/start-password-login.command";
import { PasswordLoginRequestDTO } from "../dto/staff-login.request.dto";
import { NextStepResponseDTO } from "../dto/next-step.response.dto";
@V2Controller("public/auth/staff/password")
export class StaffPasswordLoginController {
  private readonly operation;
  constructor(commands: Commands) {
    this.operation = commands.get(StartPasswordLogin);
  }
  @Post()
  @HttpCode(200)
  @SensitiveEndpoint()
  @ApiOperation({
    summary:
      "Municipal staff (managers, door staff): first sign-in step: login and password",
  })
  @ApiOkResponse({ type: NextStepResponseDTO })
  async handle(
    @Body() body: PasswordLoginRequestDTO,
  ): Promise<NextStepResponseDTO> {
    const result = await this.operation.execute({
      realm: "tenant",
      slug: body.slug,
      login: body.login,
      password: body.password,
    });
    return result.fold((outcome) => {
      if ("rejected" in outcome)
        throw new ProblemException(
          outcome.rejected === "account_locked" ? 423 : 401,
          failure(outcome.rejected),
        );
      return NextStepResponseDTO.from(outcome.next);
    }, this.handleError);
  }
  private handleError(this: void, error: StaffLoginError): never {
    switch (error.code) {
      case "not_found":
        throw new ProblemException(404, error);
      case "local_accounts_unavailable":
        throw new ProblemException(503, error);
      default:
        return assertNever(error);
    }
  }
}
