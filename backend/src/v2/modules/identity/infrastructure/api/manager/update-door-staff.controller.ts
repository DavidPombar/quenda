// SPDX-License-Identifier: AGPL-3.0-or-later
import { Body, Param, Patch, UseGuards } from "@nestjs/common";
import { ApiOkResponse, ApiOperation } from "@nestjs/swagger";
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
  UpdateDoorStaff,
  UpdateDoorStaffError,
} from "../../../application/commands/update-door-staff.command";
import {
  StaffAccountChangeResponseDTO,
  StaffPathRequestDTO,
  UpdateDoorStaffRequestDTO,
} from "../dto/staff.dto";
@V2Controller("manager/staff")
@UseGuards(PrincipalGuard)
export class UpdateDoorStaffController {
  private readonly operation;
  constructor(commands: Commands) {
    this.operation = commands.get(UpdateDoorStaff);
  }
  @Patch(":userId")
  @ApiOperation({ summary: "Resets, disables or enables a door staff account" })
  @ApiOkResponse({ type: StaffAccountChangeResponseDTO })
  async handle(
    @CurrentPrincipal() principal: Principal,
    @Param() path: StaffPathRequestDTO,
    @Body() body: UpdateDoorStaffRequestDTO,
  ): Promise<StaffAccountChangeResponseDTO> {
    return (
      await this.operation.execute({
        principal,
        userId: path.userId,
        action: body.action,
      })
    ).fold((value) => ({ ...value }), this.handleError);
  }
  private handleError(this: void, error: UpdateDoorStaffError): never {
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
