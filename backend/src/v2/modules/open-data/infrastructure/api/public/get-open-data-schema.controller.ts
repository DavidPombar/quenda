// SPDX-License-Identifier: AGPL-3.0-or-later
import { Get, Param, Res } from "@nestjs/common";
import { ApiOperation, ApiProduces, ApiResponse } from "@nestjs/swagger";
import type { Response } from "express";
import { V2Controller } from "../../../../../shared/infrastructure/api/v2-controller.decorator";
import { openDataSchemas } from "../../schemas/schemas";
import { SchemaPathRequestDTO } from "../dto/schema-path.request.dto";
import { sendOpenData } from "../open-data.response";
@V2Controller("public/open-data")
export class GetOpenDataSchemaController {
  @Get("schemas/:name")
  @ApiOperation({
    summary: "GetOpenDataSchema",
    description:
      "JSON Schema (2020-12) or Frictionless Table Schema of an open data file.",
  })
  @ApiProduces("application/schema+json")
  @ApiResponse({
    status: 200,
    description: "Successful operation",
    content: { "application/schema+json": { schema: { type: "object" } } },
  })
  handle(
    @Param() path: SchemaPathRequestDTO,
    @Res({ passthrough: true }) response: Response,
  ): string {
    return sendOpenData(
      response,
      "application/schema+json; charset=utf-8",
      path.name,
      JSON.stringify(openDataSchemas[path.name]),
    );
  }
}
