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
import { UnsubscribeResponseDTO } from "../dto/unsubscribe.response.dto";
@V2Controller("public/unsubscribe")
export class UnsubscribeController {
  private readonly operation;
  constructor(locator: Commands) {
    this.operation = locator.get(Unsubscribe);
  }
  @Post()
  @HttpCode(200)
  @ApiOperation({
    summary: "Unsubscribe",
    description: "Switches one notice off by email using the signed link",
  })
  @ApiResponse({
    status: 200,
    description: "Successful operation",
    type: UnsubscribeResponseDTO,
  })
  async handle(
    @Body() body: UnsubscribeRequestDTO,
  ): Promise<UnsubscribeResponseDTO> {
    const result = await this.operation.execute({ token: body.token });
    return result.fold((value) => ({ kind: value.kind }), this.handleError);
  }
  private handleError(this: void, error: UnsubscribeError): never {
    switch (error.code) {
      case "validation":
        throw new ProblemException(400, error);
      case "not_found":
        throw new ProblemException(404, error);
      case "unsubscribe_stale":
        throw new ProblemException(410, error);
      default:
        return assertNever(error);
    }
  }
}
