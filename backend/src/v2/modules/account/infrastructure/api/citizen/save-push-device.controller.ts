// SPDX-License-Identifier: AGPL-3.0-or-later
import { Body, Headers, HttpCode, Post, UseGuards } from "@nestjs/common";
import { ApiOperation, ApiResponse } from "@nestjs/swagger";
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
  SavePushDevice,
  SavePushDeviceError,
} from "../../../application/commands/save-push-device.command";
import { PushDeviceRequestDTO } from "../dto/push-device.request.dto";
@V2Controller("citizen/me/push-subscriptions")
@UseGuards(PrincipalGuard)
export class SavePushDeviceController {
  private readonly operation;
  constructor(locator: Commands) {
    this.operation = locator.get(SavePushDevice);
  }
  @Post()
  @HttpCode(204)
  @ApiOperation({
    summary: "SavePushDevice",
    description: "Turns push notices on for the browser that subscribed",
  })
  @ApiResponse({ status: 204, description: "Successful operation" })
  async handle(
    @CurrentPrincipal() principal: Principal,
    @Body() body: PushDeviceRequestDTO,
    @Headers("user-agent") userAgent: string | undefined,
  ): Promise<void> {
    const result = await this.operation.execute({
      principal,
      endpoint: body.endpoint,
      p256dh: body.keys.p256dh,
      auth: body.keys.auth,
      userAgent: userAgent ?? "",
    });
    return result.fold(() => undefined, this.handleError);
  }
  private handleError(this: void, error: SavePushDeviceError): never {
    switch (error.code) {
      case "forbidden":
        throw new ProblemException(403, error);
      case "not_found":
        throw new ProblemException(404, error);
      case "validation":
        throw new ProblemException(400, error);
      case "push_unavailable":
        throw new ProblemException(503, error);
      default:
        return assertNever(error);
    }
  }
}
