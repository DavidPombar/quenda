// SPDX-License-Identifier: AGPL-3.0-or-later
import { Get, Query, Req, Res } from "@nestjs/common";
import { ApiOperation, ApiProduces, ApiResponse } from "@nestjs/swagger";
import type { Request, Response } from "express";
import { V2Controller } from "../../../../../shared/infrastructure/api/v2-controller.decorator";
import { Queries } from "../../../../../shared/infrastructure/queries.locator";
import { ProblemException } from "../../../../../shared/infrastructure/api/problem";
import { AppError } from "../../../../../shared/application/errors";
import { ListOpenFacilities } from "../../../application/queries/list-open-facilities.query";
import { catalog, catalogJsonLd } from "../../formats/dcat";
import { OpenDataRequestDTO } from "../dto/open-data.request.dto";
import { publication, sendOpenData } from "../open-data.response";
@V2Controller("public/open-data")
export class GetOpenDataCatalogJsonLdController {
  private readonly operation;
  constructor(locator: Queries) {
    this.operation = locator.get(ListOpenFacilities);
  }
  @Get("catalog.jsonld")
  @ApiOperation({
    summary: "GetOpenDataCatalogJsonLd",
    description:
      "DCAT-AP-ES (NTI-RISP) catalogue of the municipality's open data, as JSON-LD.",
  })
  @ApiProduces("application/ld+json")
  @ApiResponse({
    status: 200,
    description: "Successful operation",
    content: { "application/ld+json": { schema: { type: "object" } } },
  })
  async handle(
    @Query() query: OpenDataRequestDTO,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<string> {
    const result = await this.operation.execute({ slug: query.slug });
    return result.fold(
      (data) =>
        sendOpenData(
          response,
          "application/ld+json; charset=utf-8",
          "${data.municipality.slug}-catalog.jsonld",
          JSON.stringify(catalogJsonLd(catalog(publication(request, data)))),
        ),
      this.handleError,
    );
  }
  private handleError(this: void, error: AppError<"not_found">): never {
    throw new ProblemException(404, error);
  }
}
