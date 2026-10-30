// SPDX-License-Identifier: AGPL-3.0-or-later
import { Get, Query } from "@nestjs/common";
import { ApiOkResponse, ApiOperation } from "@nestjs/swagger";
import { V2Controller } from "../../../../../shared/infrastructure/api/v2-controller.decorator";
import { Queries } from "../../../../../shared/infrastructure/queries.locator";
import { ListCatalog } from "../../../application/queries/list-catalog.query";
import { DEFAULT_PAGE_SIZE } from "../../../domain/facility.repository";
import { ListCatalogRequestDTO } from "../dto/list-catalog.request.dto";
import { CatalogPageResponseDTO } from "../dto/catalog-entry.response.dto";
@V2Controller("public/catalog")
export class ListCatalogController {
  private readonly operation;
  constructor(queries: Queries) {
    this.operation = queries.get(ListCatalog);
  }
  @Get()
  @ApiOperation({
    summary:
      "One page of active facilities across municipalities, filtered by municipality, sport, access and text",
  })
  @ApiOkResponse({ type: CatalogPageResponseDTO })
  async handle(@Query() query: ListCatalogRequestDTO) {
    return (
      await this.operation.execute({
        q: query.q,
        sport: query.sport,
        accessible:
          query.accessible === undefined
            ? undefined
            : query.accessible === "true",
        municipalities: query.municipality?.split(",") ?? [],
        page: {
          page: query.page ?? 1,
          size: query.pageSize ?? DEFAULT_PAGE_SIZE,
        },
      })
    ).fold(CatalogPageResponseDTO.from, (error: never) => error);
  }
}
