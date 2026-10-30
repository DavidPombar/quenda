// SPDX-License-Identifier: AGPL-3.0-or-later
import { Body, Delete, HttpCode, UseGuards } from "@nestjs/common";
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
  RemovePushDevice,
  RemovePushDeviceError,
} from "../../../application/commands/remove-push-device.command";
import { PushDeviceRemovalRequestDTO } from "../dto/push-device-removal.request.dto";
@V2Controller("citizen/me/push-subscriptions")
@UseGuards(PrincipalGuard)
export class RemovePushDeviceController {
  private readonly operation;
  constructor(locator: Commands) {
    this.operation = locator.get(RemovePushDevice);
  }
  @Delete()
  @HttpCode(204)
  @ApiOperation({
    summary: "RemovePushDevice",
    description: "Turns push notices off for one browser",
  })
  @ApiResponse({ status: 204, description: "Successful operation" })
  async handle(
    @CurrentPrincipal() principal: Principal,
    @Body() body: PushDeviceRemovalRequestDTO,
  ): Promise<void> {
    const result = await this.operation.execute({
      principal,
      endpoint: body.endpoint,
    });
    return result.fold(() => undefined, this.handleError);
  }
  private handleError(this: void, error: RemovePushDeviceError): never {
    switch (error.code) {
      case "forbidden":
        throw new ProblemException(403, error);
      default:
        return assertNever(error.code);
    }
  }
}
