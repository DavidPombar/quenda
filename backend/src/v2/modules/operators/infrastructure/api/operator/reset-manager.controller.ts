// SPDX-License-Identifier: AGPL-3.0-or-later
import { HttpCode, Param, Post, UseGuards } from "@nestjs/common";
import { ApiOkResponse, ApiOperation, ApiProperty } from "@nestjs/swagger";
import { IsUUID } from "class-validator";
import { V2Controller } from "../../../../../shared/infrastructure/api/v2-controller.decorator";
import { Commands } from "../../../../../shared/infrastructure/commands.locator";
import { ProblemException } from "../../../../../shared/infrastructure/api/problem";
import { assertNever } from "../../../../../shared/application/errors";
import {
  OperatorGuard,
  CurrentOperator,
} from "../../../../../shared/infrastructure/api/operator.guard";
import { OperatorPrincipal } from "../../../../../shared/application/operator-principal";
import {
  ResetManager,
  ResetManagerError,
} from "../../../application/commands/reset-manager.command";
import { TemporaryPasswordResponseDTO } from "../../../../identity/infrastructure/api/dto/temporary-password.response.dto";
class ManagerPathRequestDTO {
  @ApiProperty({ description: "Municipality UUID" })
  @IsUUID()
  id!: string;
  @ApiProperty({ description: "Manager UUID" })
  @IsUUID()
  userId!: string;
}
@V2Controller("operator/municipalities")
@UseGuards(OperatorGuard)
export class ResetManagerController {
  private readonly operation;
  constructor(commands: Commands) {
    this.operation = commands.get(ResetManager);
  }
  @Post(":id/managers/:userId/reset")
  @HttpCode(200)
  @ApiOperation({
    summary:
      "New temporary password for a manager; the second factor is set up again",
  })
  @ApiOkResponse({ type: TemporaryPasswordResponseDTO })
  async handle(
    @CurrentOperator() principal: OperatorPrincipal,
    @Param() path: ManagerPathRequestDTO,
  ): Promise<TemporaryPasswordResponseDTO> {
    return (
      await this.operation.execute({
        principal,
        municipalityId: path.id,
        userId: path.userId,
      })
    ).fold((value) => ({ ...value }), this.handleError);
  }
  private handleError(this: void, error: ResetManagerError): never {
    switch (error.code) {
      case "forbidden":
        throw new ProblemException(403, error);
      case "not_found":
        throw new ProblemException(404, error);
      case "local_accounts_unavailable":
        throw new ProblemException(503, error);
      default:
        return assertNever(error);
    }
  }
}
