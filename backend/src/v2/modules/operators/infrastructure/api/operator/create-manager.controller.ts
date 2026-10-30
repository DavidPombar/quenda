// SPDX-License-Identifier: AGPL-3.0-or-later
import { Body, Param, Post, UseGuards } from "@nestjs/common";
import { ApiCreatedResponse, ApiOperation } from "@nestjs/swagger";
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
  CreateManager,
  CreateManagerError,
} from "../../../application/commands/create-manager.command";
import {
  CreateManagerRequestDTO,
  MunicipalityPathRequestDTO,
} from "../dto/create-manager.request.dto";
import { StaffMemberResponseDTO } from "../dto/staff-member.response.dto";
@V2Controller("operator/municipalities")
@UseGuards(OperatorGuard)
export class CreateManagerController {
  private readonly operation;
  constructor(commands: Commands) {
    this.operation = commands.get(CreateManager);
  }
  @Post(":id/managers")
  @ApiOperation({ summary: "CreateManager" })
  @ApiCreatedResponse({ type: StaffMemberResponseDTO })
  async handle(
    @CurrentOperator() principal: OperatorPrincipal,
    @Param() path: MunicipalityPathRequestDTO,
    @Body() body: CreateManagerRequestDTO,
  ) {
    const result = await this.operation.execute({
      principal,
      municipalityId: path.id,
      id: body.id,
      displayName: body.displayName,
      email: body.email,
      login: body.login,
    });
    return result.fold(StaffMemberResponseDTO.from, this.handleError);
  }
  private handleError(this: void, error: CreateManagerError): never {
    switch (error.code) {
      case "forbidden":
        throw new ProblemException(403, error);
      case "not_found":
        throw new ProblemException(404, error);
      case "id_reused":
      case "login_taken":
        throw new ProblemException(409, error);
      case "validation":
        throw new ProblemException(400, error);
      case "local_accounts_unavailable":
        throw new ProblemException(503, error);
      default:
        return assertNever(error);
    }
  }
}
