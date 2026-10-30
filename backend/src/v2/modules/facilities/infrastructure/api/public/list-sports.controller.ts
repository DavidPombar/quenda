// SPDX-License-Identifier: AGPL-3.0-or-later
import { Get, Query } from "@nestjs/common";
import { ApiOperation, ApiResponse } from "@nestjs/swagger";
import { V2Controller } from "../../../../../shared/infrastructure/api/v2-controller.decorator";
import { Queries } from "../../../../../shared/infrastructure/queries.locator";
import { ListSports } from "../../../application/queries/list-sports.query";
import { SportsRequestDTO } from "../dto/sports.request.dto";
import { SportResponseDTO } from "../dto/sport.response.dto";
@V2Controller("public/sports")
export class ListSportsController {
  private readonly operation;
  constructor(locator: Queries) {
    this.operation = locator.get(ListSports);
  }
  @Get()
  @ApiOperation({
    summary: "ListSports",
    description:
      "Visible sports that at least one facility offers in the given municipalities, one per code, for catalogue filters.",
  })
  @ApiResponse({
    status: 200,
    description: "Sports in display order",
    type: SportResponseDTO,
    isArray: true,
  })
  async handle(@Query() query: SportsRequestDTO): Promise<SportResponseDTO[]> {
    const result = await this.operation.execute({
      municipalities: query.municipality?.split(",") ?? [],
    });
    return result.fold(
      (sports) => sports.map(SportResponseDTO.from),
      (error: never) => error,
    );
  }
}
