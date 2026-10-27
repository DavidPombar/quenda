// SPDX-License-Identifier: AGPL-3.0-or-later
import { Get, Query, UseGuards } from "@nestjs/common";
import { ApiOkResponse, ApiOperation } from "@nestjs/swagger";
import { V2Controller } from "../../../../../shared/infrastructure/api/v2-controller.decorator";
import { Queries } from "../../../../../shared/infrastructure/queries.locator";
import {
  PrincipalGuard,
  CurrentPrincipal,
} from "../../../../../shared/infrastructure/api/principal.guard";
import { Principal } from "../../../../../shared/application/principal";
import { ProblemException } from "../../../../../shared/infrastructure/api/problem";
import { assertNever } from "../../../../../shared/application/errors";
import {
  ListManagedBookings,
  ListManagedBookingsError,
} from "../../../application/queries/list-managed-bookings.query";
import { ManagedBookingsQueryRequestDTO } from "../dto/managed-bookings-query.request.dto";
import { ManagedBookingResponseDTO } from "../dto/managed-booking.response.dto";
@V2Controller("manager/bookings")
@UseGuards(PrincipalGuard)
export class ListManagedBookingsController {
  private readonly operation;
  constructor(queries: Queries) {
    this.operation = queries.get(ListManagedBookings);
  }
  @Get()
  @ApiOperation({ summary: "ListManagedBookings" })
  @ApiOkResponse({ type: ManagedBookingResponseDTO, isArray: true })
  async handle(
    @CurrentPrincipal() principal: Principal,
    @Query() query: ManagedBookingsQueryRequestDTO,
  ): Promise<ManagedBookingResponseDTO[]> {
    return (
      await this.operation.execute({
        principal,
        date: query.date,
        facilityId: query.facilityId,
      })
    ).fold(
      (values) => values.map(ManagedBookingResponseDTO.fromManaged),
      this.handleError,
    );
  }
  private handleError(this: void, error: ListManagedBookingsError): never {
    switch (error.code) {
      case "forbidden":
        throw new ProblemException(403, error);
      case "not_found":
        throw new ProblemException(404, error);
      case "validation":
        throw new ProblemException(400, error);
      default:
        return assertNever(error);
    }
  }
}
