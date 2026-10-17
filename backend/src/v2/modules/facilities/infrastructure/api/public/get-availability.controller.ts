// SPDX-License-Identifier: AGPL-3.0-or-later
import { Get, Param, Query } from "@nestjs/common";
import { ApiOperation, ApiResponse } from "@nestjs/swagger";
import { V2Controller } from "../../../../../shared/infrastructure/api/v2-controller.decorator";
import { Queries } from "../../../../../shared/infrastructure/queries.locator";
import { GetAvailability } from "../../../application/queries/get-availability.query";
import { ProblemException } from "../../../../../shared/infrastructure/api/problem";
import {
  AppError,
  assertNever,
} from "../../../../../shared/application/errors";
import { IdPathRequestDTO } from "../dto/id-path.request.dto";
import { AvailabilityRequestDTO } from "../dto/availability.request.dto";
import { SlotResponseDTO } from "../dto/slot.response.dto";
@V2Controller("public/availability")
export class GetAvailabilityController {
  private readonly operation;
  constructor(locator: Queries) {
    this.operation = locator.get(GetAvailability);
  }
  @Get(":id")
  @ApiOperation({ summary: "GetAvailability" })
  @ApiResponse({
    status: 200,
    description: "Successful operation",
    type: SlotResponseDTO,
    isArray: true,
  })
  async handle(
    @Param() path: IdPathRequestDTO,
    @Query() query: AvailabilityRequestDTO,
  ): Promise<SlotResponseDTO[]> {
    const result = await this.operation.execute({
      id: path.id,
      slug: query.slug,
      date: query.date,
    });
    return result.fold(
      (values) => values.map(SlotResponseDTO.from),
      this.handleError,
    );
  }
  private handleError(
    this: void,
    error: AppError<"not_found"> | AppError<"validation">,
  ): never {
    switch (error.code) {
      case "not_found":
        throw new ProblemException(404, error);
      case "validation":
        throw new ProblemException(400, error);
      default:
        return assertNever(error);
    }
  }
}
