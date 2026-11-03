// SPDX-License-Identifier: AGPL-3.0-or-later
import { Body, Post, UseGuards } from "@nestjs/common";
import { ApiOperation, ApiResponse } from "@nestjs/swagger";
import { Commands } from "../../../../../shared/infrastructure/commands.locator";
import { V2Controller } from "../../../../../shared/infrastructure/api/v2-controller.decorator";
import {
  PrincipalGuard,
  CurrentPrincipal,
} from "../../../../../shared/infrastructure/api/principal.guard";
import { Principal } from "../../../../../shared/application/principal";
import { ProblemException } from "../../../../../shared/infrastructure/api/problem";
import { assertNever } from "../../../../../shared/application/errors";
import {
  EnrolInActivity,
  EnrolInActivityError,
} from "../../../application/commands/enrol-in-activity.command";
import { EnrolmentRequestDTO } from "../dto/enrolment.request.dto";
import { MyEnrolmentResponseDTO } from "../dto/enrolment.response.dto";
@V2Controller("citizen/activity-enrolments")
@UseGuards(PrincipalGuard)
export class EnrolInActivityController {
  private readonly operation;
  constructor(locator: Commands) {
    this.operation = locator.get(EnrolInActivity);
  }
  @Post()
  @ApiOperation({
    summary: "EnrolInActivity",
    description:
      "Takes a free place, or joins the waiting list when there is none",
  })
  @ApiResponse({ status: 201, type: MyEnrolmentResponseDTO })
  async handle(
    @CurrentPrincipal() principal: Principal,
    @Body() body: EnrolmentRequestDTO,
  ): Promise<MyEnrolmentResponseDTO> {
    const result = await this.operation.execute({
      principal,
      id: body.id,
      activityId: body.activityId,
      dependantId: body.dependantId ?? null,
    });
    return result.fold(MyEnrolmentResponseDTO.from, this.handleError);
  }
  private handleError(this: void, error: EnrolInActivityError): never {
    switch (error.code) {
      case "forbidden":
        throw new ProblemException(403, error);
      case "not_found":
        throw new ProblemException(404, error);
      case "enrolment_closed":
      case "age_not_allowed":
        throw new ProblemException(422, error);
      case "already_enrolled":
      case "id_reused":
        throw new ProblemException(409, error);
      default:
        return assertNever(error);
    }
  }
}
