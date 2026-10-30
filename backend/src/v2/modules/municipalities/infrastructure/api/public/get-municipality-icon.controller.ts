// SPDX-License-Identifier: AGPL-3.0-or-later
import { Get, Param, Res } from "@nestjs/common";
import { ApiOperation, ApiProduces, ApiResponse } from "@nestjs/swagger";
import type { Response } from "express";
import { IsString, Matches } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";
import { V2Controller } from "../../../../../shared/infrastructure/api/v2-controller.decorator";
import { Queries } from "../../../../../shared/infrastructure/queries.locator";
import { ProblemException } from "../../../../../shared/infrastructure/api/problem";
import { GetMunicipalityIcon } from "../../../application/queries/get-municipality-icon.query";
class SlugPathRequestDTO {
  @ApiProperty({ description: "Public municipality identifier" })
  @IsString()
  @Matches(/^[a-z0-9-]{1,80}$/)
  slug!: string;
}
@V2Controller("public/municipalities")
export class GetMunicipalityIconController {
  private readonly operation;
  constructor(locator: Queries) {
    this.operation = locator.get(GetMunicipalityIcon);
  }
  @Get(":slug/icon")
  @ApiOperation({ summary: "GetMunicipalityIcon" })
  @ApiProduces("image/png")
  @ApiResponse({
    status: 200,
    description: "Square 512 px icon of the installed app",
  })
  async handle(
    @Param() path: SlugPathRequestDTO,
    @Res() response: Response,
  ): Promise<void> {
    const result = await this.operation.execute({ slug: path.slug });
    result.fold(
      (icon) => {
        // URLs carry ?v=<hash>, so a new upload changes the URL and the image can be cached.
        response
          .status(200)
          .type("image/png")
          .setHeader("Cache-Control", "public, max-age=31536000, immutable")
          .setHeader("ETag", `"${icon.version}"`)
          .send(Buffer.from(icon.data));
      },
      (error) => {
        throw new ProblemException(404, error);
      },
    );
  }
}
