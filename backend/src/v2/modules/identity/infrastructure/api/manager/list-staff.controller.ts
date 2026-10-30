// SPDX-License-Identifier: AGPL-3.0-or-later
import { Get, UseGuards } from "@nestjs/common";
import { ApiOkResponse, ApiOperation } from "@nestjs/swagger";
import { V2Controller } from "../../../../../shared/infrastructure/api/v2-controller.decorator";
import { Queries } from "../../../../../shared/infrastructure/queries.locator";
import { ProblemException } from "../../../../../shared/infrastructure/api/problem";
import { AppError } from "../../../../../shared/application/errors";
import {
  PrincipalGuard,
  CurrentPrincipal,
} from "../../../../../shared/infrastructure/api/principal.guard";
import { Principal } from "../../../../../shared/application/principal";
import { ListStaff } from "../../../application/queries/list-staff.query";
import { StaffAccountResponseDTO } from "../dto/staff.dto";
@V2Controller("manager/staff")
@UseGuards(PrincipalGuard)
export class ListStaffController {
  private readonly operation;
  constructor(queries: Queries) {
    this.operation = queries.get(ListStaff);
  }
  @Get()
  @ApiOperation({ summary: "Managers and door staff of the municipality" })
  @ApiOkResponse({ type: StaffAccountResponseDTO, isArray: true })
  async handle(@CurrentPrincipal() principal: Principal) {
    return (await this.operation.execute({ principal })).fold(
      (values) => values.map(StaffAccountResponseDTO.from),
      this.handleError,
    );
  }
  private handleError(this: void, error: AppError<"forbidden">): never {
    throw new ProblemException(403, error);
  }
}
