// SPDX-License-Identifier: AGPL-3.0-or-later
import { HttpCode, Post, UseGuards } from "@nestjs/common";
import { ApiOperation, ApiResponse } from "@nestjs/swagger";
import { V2Controller } from "../../../../../shared/infrastructure/api/v2-controller.decorator";
import { Commands } from "../../../../../shared/infrastructure/commands.locator";
import {
  PrincipalGuard,
  CurrentPrincipal,
} from "../../../../../shared/infrastructure/api/principal.guard";
import { Principal } from "../../../../../shared/application/principal";
import { ProblemException } from "../../../../../shared/infrastructure/api/problem";
import { RotateAccessKey } from "../../../application/commands/rotate-access-key.command";
import { AccessKeyResponseDTO } from "../dto/access-key.response.dto";
@V2Controller("manager/access-keys")
@UseGuards(PrincipalGuard)
export class RotateAccessKeyController {
  private readonly operation;
  constructor(locator: Commands) {
    this.operation = locator.get(RotateAccessKey);
  }
  @Post("rotation")
  @HttpCode(201)
  @ApiOperation({
    summary: "RotateAccessKey",
    description:
      "New passes use a new key; the old one stays published for 48 h",
  })
  @ApiResponse({ status: 201, type: AccessKeyResponseDTO })
  async handle(
    @CurrentPrincipal() principal: Principal,
  ): Promise<AccessKeyResponseDTO> {
    const result = await this.operation.execute({ principal });
    return result.fold(AccessKeyResponseDTO.from, (error) => {
      throw new ProblemException(403, error);
    });
  }
}
