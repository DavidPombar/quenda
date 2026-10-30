// SPDX-License-Identifier: AGPL-3.0-or-later
import { Get, Query } from "@nestjs/common";
import { ApiOkResponse, ApiOperation } from "@nestjs/swagger";
import { V2Controller } from "../../../../../shared/infrastructure/api/v2-controller.decorator";
import { Queries } from "../../../../../shared/infrastructure/queries.locator";
import { ListSports } from "../../../application/queries/list-sports.query";
import { ListSportsRequestDTO } from "../dto/list-sports.request.dto";
import { SportResponseDTO } from "../dto/sport.response.dto";
@V2Controller("public/sports")
export class ListSportsController {
  private readonly operation;
  constructor(queries: Queries) {
    this.operation = queries.get(ListSports);
  }
  @Get()
  @ApiOperation({
    summary: "Visible sports of some municipalities, for catalogue filters",
  })
  @ApiOkResponse({ type: SportResponseDTO, isArray: true })
  async handle(@Query() query: ListSportsRequestDTO) {
    return (
      await this.operation.execute({
        municipalities: query.municipality?.split(",") ?? [],
      })
    ).fold(
      (values) => values.map(SportResponseDTO.from),
      (error: never) => error,
    );
  }
}
