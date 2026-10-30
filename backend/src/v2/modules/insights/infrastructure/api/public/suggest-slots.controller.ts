// SPDX-License-Identifier: AGPL-3.0-or-later
import { Get, Query } from "@nestjs/common";
import { ApiOperation, ApiResponse } from "@nestjs/swagger";
import { V2Controller } from "../../../../../shared/infrastructure/api/v2-controller.decorator";
import { Queries } from "../../../../../shared/infrastructure/queries.locator";
import {
  SuggestSlots,
  SuggestSlotsError,
} from "../../../application/queries/suggest-slots.query";
import { ProblemException } from "../../../../../shared/infrastructure/api/problem";
import { assertNever } from "../../../../../shared/application/errors";
import { SlotSuggestionsRequestDTO } from "../dto/slot-suggestions.request.dto";
import { SlotSuggestionsResponseDTO } from "../dto/slot-suggestion.response.dto";
@V2Controller("public/slot-suggestions")
export class SuggestSlotsController {
  private readonly operation;
  constructor(locator: Queries) {
    this.operation = locator.get(SuggestSlots);
  }
  @Get()
  @ApiOperation({
    summary: "SuggestSlots",
    description:
      "Up to three free slots on the same day, in this and other facilities of the same sport, least usually occupied first",
  })
  @ApiResponse({
    status: 200,
    description: "Successful operation",
    type: SlotSuggestionsResponseDTO,
    isArray: false,
  })
  async handle(
    @Query() query: SlotSuggestionsRequestDTO,
  ): Promise<SlotSuggestionsResponseDTO> {
    const result = await this.operation.execute({
      slug: query.slug,
      facilityId: query.facilityId,
      date: query.date,
      around: query.around,
    });
    return result.fold(SlotSuggestionsResponseDTO.from, this.handleError);
  }
  private handleError(this: void, error: SuggestSlotsError): never {
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
