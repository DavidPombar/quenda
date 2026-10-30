// SPDX-License-Identifier: AGPL-3.0-or-later
import { Body, HttpCode, Post } from "@nestjs/common";
import { ApiOkResponse, ApiOperation } from "@nestjs/swagger";
import { V2Controller } from "../../../../../shared/infrastructure/api/v2-controller.decorator";
import { Commands } from "../../../../../shared/infrastructure/commands.locator";
import { ProblemException } from "../../../../../shared/infrastructure/api/problem";
import { SensitiveEndpoint } from "../../../../../shared/infrastructure/api/rate-limit";
import {
  AppError,
  assertNever,
} from "../../../../../shared/application/errors";
import { ChangeTemporaryPassword } from "../../../application/commands/change-temporary-password.command";
import { PasswordChangeRequestDTO } from "../dto/staff-login.request.dto";
import { NextStepResponseDTO } from "../dto/next-step.response.dto";
@V2Controller("public/auth/local/password-change")
export class ChangeTemporaryPasswordController {
  private readonly operation;
  constructor(commands: Commands) {
    this.operation = commands.get(ChangeTemporaryPassword);
  }
  @Post()
  @HttpCode(200)
  @SensitiveEndpoint()
  @ApiOperation({ summary: "Local account: replaces the temporary password" })
  @ApiOkResponse({ type: NextStepResponseDTO })
  async handle(
    @Body() body: PasswordChangeRequestDTO,
  ): Promise<NextStepResponseDTO> {
    return (
      await this.operation.execute({
        ticket: body.ticket,
        newPassword: body.newPassword,
      })
    ).fold(NextStepResponseDTO.from, this.handleError);
  }
  private handleError(
    this: void,
    error: AppError<"login_expired"> | AppError<"password_weak">,
  ): never {
    switch (error.code) {
      case "login_expired":
        throw new ProblemException(401, error);
      case "password_weak":
        throw new ProblemException(400, error);
      default:
        return assertNever(error);
    }
  }
}
