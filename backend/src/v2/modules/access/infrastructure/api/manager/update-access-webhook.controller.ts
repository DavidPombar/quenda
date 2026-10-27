// SPDX-License-Identifier: AGPL-3.0-or-later
import { Body, Put, UseGuards } from "@nestjs/common";
import { ApiOperation, ApiResponse } from "@nestjs/swagger";
import { V2Controller } from "../../../../../shared/infrastructure/api/v2-controller.decorator";
import { Commands } from "../../../../../shared/infrastructure/commands.locator";
import {
  PrincipalGuard,
  CurrentPrincipal,
} from "../../../../../shared/infrastructure/api/principal.guard";
import { Principal } from "../../../../../shared/application/principal";
import { ProblemException } from "../../../../../shared/infrastructure/api/problem";
import { assertNever } from "../../../../../shared/application/errors";
import {
  UpdateAccessWebhook,
  UpdateAccessWebhookError,
} from "../../../application/commands/update-access-webhook.command";
import { AccessWebhookRequestDTO } from "../dto/access-webhook.request.dto";
import { AccessWebhookResponseDTO } from "../dto/access-webhook.response.dto";
@V2Controller("manager/access-webhook")
@UseGuards(PrincipalGuard)
export class UpdateAccessWebhookController {
  private readonly operation;
  constructor(locator: Commands) {
    this.operation = locator.get(UpdateAccessWebhook);
  }
  @Put()
  @ApiOperation({
    summary: "UpdateAccessWebhook",
    description:
      "Sends signed credential.granted/revoked calls to the council's access-control system",
  })
  @ApiResponse({ status: 200, type: AccessWebhookResponseDTO })
  async handle(
    @CurrentPrincipal() principal: Principal,
    @Body() body: AccessWebhookRequestDTO,
  ): Promise<AccessWebhookResponseDTO> {
    const result = await this.operation.execute({
      principal,
      url: body.url,
      rotateSecret: body.rotateSecret ?? false,
    });
    return result.fold((value) => value, this.handleError);
  }
  private handleError(this: void, error: UpdateAccessWebhookError): never {
    switch (error.code) {
      case "forbidden":
        throw new ProblemException(403, error);
      case "validation":
        throw new ProblemException(400, error);
      default:
        return assertNever(error);
    }
  }
}
