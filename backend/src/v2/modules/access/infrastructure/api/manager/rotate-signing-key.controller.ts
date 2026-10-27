// SPDX-License-Identifier: AGPL-3.0-or-later
import { Post, UseGuards } from "@nestjs/common";
import { ApiCreatedResponse, ApiOperation } from "@nestjs/swagger";
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
  RotateSigningKey,
  RotateSigningKeyError,
} from "../../../application/commands/rotate-signing-key.command";
import { SigningKeyResponseDTO } from "../dto/signing-key.response.dto";
@V2Controller("manager/access/key-rotations")
@UseGuards(PrincipalGuard)
export class RotateSigningKeyController {
  private readonly operation;
  constructor(commands: Commands) {
    this.operation = commands.get(RotateSigningKey);
  }
  @Post()
  @ApiOperation({ summary: "RotateSigningKey" })
  @ApiCreatedResponse({ type: SigningKeyResponseDTO })
  async handle(
    @CurrentPrincipal() principal: Principal,
  ): Promise<SigningKeyResponseDTO> {
    return (await this.operation.execute({ principal })).fold(
      SigningKeyResponseDTO.from,
      this.handleError,
    );
  }
  private handleError(this: void, error: RotateSigningKeyError): never {
    switch (error.code) {
      case "forbidden":
        throw new ProblemException(403, error);
      default:
        return assertNever(error.code);
    }
  }
}
