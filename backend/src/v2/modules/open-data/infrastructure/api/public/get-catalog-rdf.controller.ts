// SPDX-License-Identifier: AGPL-3.0-or-later
import { Get, Query, Req, Res } from "@nestjs/common";
import { ApiOperation, ApiProduces, ApiResponse } from "@nestjs/swagger";
import type { Request, Response } from "express";
import { V2Controller } from "../../../../../shared/infrastructure/api/v2-controller.decorator";
import { Queries } from "../../../../../shared/infrastructure/queries.locator";
import { ProblemException } from "../../../../../shared/infrastructure/api/problem";
import { AppError } from "../../../../../shared/application/errors";
import { ListOpenFacilities } from "../../../application/queries/list-open-facilities.query";
import { catalog, catalogRdfXml } from "../../formats/dcat";
import { OpenDataRequestDTO } from "../dto/open-data.request.dto";
import { publication, sendOpenData } from "../open-data.response";
@V2Controller("public/open-data")
export class GetOpenDataCatalogRdfController {
  private readonly operation;
  constructor(locator: Queries) {
    this.operation = locator.get(ListOpenFacilities);
  }
  @Get("catalog.rdf")
  @ApiOperation({
    summary: "GetOpenDataCatalogRdf",
    description:
      "DCAT-AP-ES (NTI-RISP) catalogue of the municipality's open data, as RDF/XML for the datos.gob.es federation.",
  })
  @ApiProduces("application/rdf+xml")
  @ApiResponse({
    status: 200,
    description: "Successful operation",
    content: { "application/rdf+xml": { schema: { type: "string" } } },
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
          "application/rdf+xml; charset=utf-8",
          `${data.municipality.slug}-catalog.rdf`,
          catalogRdfXml(catalog(publication(request, data))),
        ),
      this.handleError,
    );
  }
  private handleError(this: void, error: AppError<"not_found">): never {
    throw new ProblemException(404, error);
  }
}
