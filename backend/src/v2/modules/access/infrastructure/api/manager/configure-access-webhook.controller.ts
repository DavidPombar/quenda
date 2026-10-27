// SPDX-License-Identifier: AGPL-3.0-or-later
import { Body, Put, UseGuards } from "@nestjs/common";
import { ApiOkResponse, ApiOperation } from "@nestjs/swagger";
import { V2Controller } from "../../../../../shared/infrastructure/api/v2-controller.decorator";
import {
  PrincipalGuard,
  CurrentPrincipal,
} from "../../../../../shared/infrastructure/api/principal.guard";
import { Principal } from "../../../../../shared/application/principal";
import { ProblemException } from "../../../../../shared/infrastructure/api/problem";
import { assertNever } from "../../../../../shared/application/errors";
import { Commands } from "../../../../../shared/infrastructure/commands.locator";
import {
  ConfigureAccessWebhook,
  ConfigureAccessWebhookError,
} from "../../../application/commands/configure-access-webhook.command";
import { ConfigureAccessWebhookRequestDTO } from "../dto/configure-access-webhook.request.dto";
import { ConfigureAccessWebhookResponseDTO } from "../dto/configure-access-webhook.response.dto";
@V2Controller("manager/access/webhook")
@UseGuards(PrincipalGuard)
export class ConfigureAccessWebhookController {
  private readonly operation;
  constructor(commands: Commands) {
    this.operation = commands.get(ConfigureAccessWebhook);
  }
  @Put()
  @ApiOperation({ summary: "ConfigureAccessWebhook" })
  @ApiOkResponse({ type: ConfigureAccessWebhookResponseDTO })
  async handle(
    @CurrentPrincipal() principal: Principal,
    @Body() body: ConfigureAccessWebhookRequestDTO,
  ): Promise<ConfigureAccessWebhookResponseDTO> {
    return (
      await this.operation.execute({
        principal,
        url: body.url,
        rotateSecret: body.rotateSecret ?? false,
      })
    ).fold((value) => value, this.handleError);
  }
  private handleError(this: void, error: ConfigureAccessWebhookError): never {
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
