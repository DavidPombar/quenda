// SPDX-License-Identifier: AGPL-3.0-or-later
import { Body, HttpCode, Post } from "@nestjs/common";
import { ApiOperation, ApiResponse } from "@nestjs/swagger";
import { V2Controller } from "../../../../../shared/infrastructure/api/v2-controller.decorator";
import { Commands } from "../../../../../shared/infrastructure/commands.locator";
import {
  Unsubscribe,
  UnsubscribeError,
} from "../../../application/commands/unsubscribe.command";
import { ProblemException } from "../../../../../shared/infrastructure/api/problem";
import { assertNever } from "../../../../../shared/application/errors";
import { UnsubscribeRequestDTO } from "../dto/unsubscribe.request.dto";
@V2Controller("public/unsubscribe")
export class UnsubscribeController {
  private readonly operation;
  constructor(locator: Commands) {
    this.operation = locator.get(Unsubscribe);
  }
  @Post()
  @HttpCode(204)
  @ApiOperation({
    summary: "Unsubscribe",
    description: "Switches email reminders off using the signed link",
  })
  @ApiResponse({ status: 204, description: "Successful operation" })
  async handle(@Body() body: UnsubscribeRequestDTO): Promise<void> {
    const result = await this.operation.execute({ token: body.token });
    return result.fold(() => undefined, this.handleError);
  }
  private handleError(this: void, error: UnsubscribeError): never {
    switch (error.code) {
      case "validation":
        throw new ProblemException(400, error);
      case "not_found":
        throw new ProblemException(404, error);
      default:
        return assertNever(error);
    }
  }
}
