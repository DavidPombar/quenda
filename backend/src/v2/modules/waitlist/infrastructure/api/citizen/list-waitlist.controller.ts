// SPDX-License-Identifier: AGPL-3.0-or-later
import { Get, UseGuards } from "@nestjs/common";
import { ApiOperation, ApiResponse } from "@nestjs/swagger";
import { V2Controller } from "../../../../../shared/infrastructure/api/v2-controller.decorator";
import { Queries } from "../../../../../shared/infrastructure/queries.locator";
import { ListWaitlist } from "../../../application/queries/list-waitlist.query";
import {
  PrincipalGuard,
  CurrentPrincipal,
} from "../../../../../shared/infrastructure/api/principal.guard";
import { Principal } from "../../../../../shared/application/principal";
import { ProblemException } from "../../../../../shared/infrastructure/api/problem";
import { AppError } from "../../../../../shared/application/errors";
import { WaitlistEntryViewResponseDTO } from "../dto/waitlist-entry.response.dto";
@V2Controller("citizen/waitlist")
@UseGuards(PrincipalGuard)
export class ListWaitlistController {
  private readonly operation;
  constructor(locator: Queries) {
    this.operation = locator.get(ListWaitlist);
  }
  @Get()
  @ApiOperation({ summary: "ListWaitlist" })
  @ApiResponse({
    status: 200,
    description: "Successful operation",
    type: WaitlistEntryViewResponseDTO,
    isArray: true,
  })
  async handle(
    @CurrentPrincipal() principal: Principal,
  ): Promise<WaitlistEntryViewResponseDTO[]> {
    const result = await this.operation.execute({ principal });
    return result.fold(
      (values) => values.map(WaitlistEntryViewResponseDTO.fromView),
      this.handleError,
    );
  }
  private handleError(this: void, error: AppError<"forbidden">): never {
    throw new ProblemException(403, error);
  }
}
