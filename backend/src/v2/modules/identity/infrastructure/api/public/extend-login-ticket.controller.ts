// SPDX-License-Identifier: AGPL-3.0-or-later
import { Body, HttpCode, Post } from "@nestjs/common";
import { ApiOkResponse, ApiOperation } from "@nestjs/swagger";
import { V2Controller } from "../../../../../shared/infrastructure/api/v2-controller.decorator";
import { Commands } from "../../../../../shared/infrastructure/commands.locator";
import { ProblemException } from "../../../../../shared/infrastructure/api/problem";
import { SensitiveEndpoint } from "../../../../../shared/infrastructure/api/rate-limit";
import { ExtendLoginTicket } from "../../../application/commands/extend-login-ticket.command";
import { TicketExtensionRequestDTO } from "../dto/staff-login.request.dto";
import { SessionExpiryResponseDTO } from "../dto/session-expiry.response.dto";
@V2Controller("public/auth/local/ticket-extension")
export class ExtendLoginTicketController {
  private readonly operation;
  constructor(commands: Commands) {
    this.operation = commands.get(ExtendLoginTicket);
  }
  @Post()
  @HttpCode(200)
  @SensitiveEndpoint()
  @ApiOperation({
    summary: "Local account: ten more minutes for the current sign-in step",
  })
  @ApiOkResponse({ type: SessionExpiryResponseDTO })
  async handle(
    @Body() body: TicketExtensionRequestDTO,
  ): Promise<SessionExpiryResponseDTO> {
    return (await this.operation.execute({ ticket: body.ticket })).fold(
      (until) => ({ expiresAt: until.toString() }),
      (error) => {
        throw new ProblemException(401, error);
      },
    );
  }
}
