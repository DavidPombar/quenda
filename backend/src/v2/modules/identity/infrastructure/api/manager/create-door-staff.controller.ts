// SPDX-License-Identifier: AGPL-3.0-or-later
import { Body, Post, UseGuards } from "@nestjs/common";
import { ApiCreatedResponse, ApiOperation } from "@nestjs/swagger";
import { V2Controller } from "../../../../../shared/infrastructure/api/v2-controller.decorator";
import { Commands } from "../../../../../shared/infrastructure/commands.locator";
import { ProblemException } from "../../../../../shared/infrastructure/api/problem";
import { assertNever } from "../../../../../shared/application/errors";
import {
  PrincipalGuard,
  CurrentPrincipal,
} from "../../../../../shared/infrastructure/api/principal.guard";
import { Principal } from "../../../../../shared/application/principal";
import {
  CreateDoorStaff,
  CreateDoorStaffError,
} from "../../../application/commands/create-door-staff.command";
import {
  CreateDoorStaffRequestDTO,
  StaffAccountChangeResponseDTO,
} from "../dto/staff.dto";
@V2Controller("manager/staff")
@UseGuards(PrincipalGuard)
export class CreateDoorStaffController {
  private readonly operation;
  constructor(commands: Commands) {
    this.operation = commands.get(CreateDoorStaff);
  }
  @Post()
  @ApiOperation({
    summary: "Door staff account with a temporary password shown once",
  })
  @ApiCreatedResponse({ type: StaffAccountChangeResponseDTO })
  async handle(
    @CurrentPrincipal() principal: Principal,
    @Body() body: CreateDoorStaffRequestDTO,
  ): Promise<StaffAccountChangeResponseDTO> {
    return (
      await this.operation.execute({
        principal,
        id: body.id,
        displayName: body.displayName,
        login: body.login,
      })
    ).fold((value) => ({ ...value }), this.handleError);
  }
  private handleError(this: void, error: CreateDoorStaffError): never {
    switch (error.code) {
      case "forbidden":
        throw new ProblemException(403, error);
      case "validation":
        throw new ProblemException(400, error);
      case "id_reused":
      case "login_taken":
        throw new ProblemException(409, error);
      case "local_accounts_unavailable":
        throw new ProblemException(503, error);
      default:
        return assertNever(error);
    }
  }
}
