// SPDX-License-Identifier: AGPL-3.0-or-later
import { Post, Body, UseGuards } from "@nestjs/common";
import { ApiOperation, ApiResponse } from "@nestjs/swagger";
import { V2Controller } from "../../../../../shared/infrastructure/api/v2-controller.decorator";
import { Commands } from "../../../../../shared/infrastructure/commands.locator";
import {
  JoinWaitlist,
  JoinWaitlistError,
} from "../../../application/commands/join-waitlist.command";
import {
  PrincipalGuard,
  CurrentPrincipal,
} from "../../../../../shared/infrastructure/api/principal.guard";
import { Principal } from "../../../../../shared/application/principal";
import { ProblemException } from "../../../../../shared/infrastructure/api/problem";
import { assertNever } from "../../../../../shared/application/errors";
import { JoinWaitlistRequestDTO } from "../dto/join-waitlist.request.dto";
import { WaitlistEntryResponseDTO } from "../dto/waitlist-entry.response.dto";
@V2Controller("citizen/waitlist")
@UseGuards(PrincipalGuard)
export class JoinWaitlistController {
  private readonly operation;
  constructor(locator: Commands) {
    this.operation = locator.get(JoinWaitlist);
  }
  @Post()
  @ApiOperation({ summary: "JoinWaitlist" })
  @ApiResponse({
    status: 201,
    description: "Successful operation",
    type: WaitlistEntryResponseDTO,
    isArray: false,
  })
  async handle(
    @CurrentPrincipal() principal: Principal,
    @Body() body: JoinWaitlistRequestDTO,
  ): Promise<WaitlistEntryResponseDTO> {
    const result = await this.operation.execute({
      principal,
      id: body.id,
      facilityId: body.facilityId,
      resourceId: body.resourceId,
      start: body.start,
    });
    return result.fold(WaitlistEntryResponseDTO.from, this.handleError);
  }
  private handleError(this: void, error: JoinWaitlistError): never {
    switch (error.code) {
      case "forbidden":
        throw new ProblemException(403, error);
      case "not_found":
        throw new ProblemException(404, error);
      case "validation":
        throw new ProblemException(400, error);
      case "outside_opening":
      case "booking_window":
      case "booking_blocked":
      case "booking_limit":
      case "resource_required":
      case "resource_unavailable":
      case "waitlist_disabled":
      case "waitlist_limit":
        throw new ProblemException(422, error);
      case "slot_available":
      case "already_booked":
      case "already_waiting":
      case "id_reused":
        throw new ProblemException(409, error);
      default:
        return assertNever(error);
    }
  }
}
