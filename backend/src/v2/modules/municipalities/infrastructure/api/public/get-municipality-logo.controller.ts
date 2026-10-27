// SPDX-License-Identifier: AGPL-3.0-or-later
import { Get, Param, Res } from "@nestjs/common";
import { ApiOperation, ApiProduces, ApiResponse } from "@nestjs/swagger";
import type { Response } from "express";
import { IsString, Matches } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";
import { V2Controller } from "../../../../../shared/infrastructure/api/v2-controller.decorator";
import { Queries } from "../../../../../shared/infrastructure/queries.locator";
import { ProblemException } from "../../../../../shared/infrastructure/api/problem";
import { GetMunicipalityLogo } from "../../../application/queries/get-municipality-logo.query";
class SlugPathRequestDTO {
  @ApiProperty({ description: "Public municipality identifier" })
  @IsString()
  @Matches(/^[a-z0-9-]{1,80}$/)
  slug!: string;
}
@V2Controller("public/municipalities")
export class GetMunicipalityLogoController {
  private readonly operation;
  constructor(locator: Queries) {
    this.operation = locator.get(GetMunicipalityLogo);
  }
  @Get(":slug/logo")
  @ApiOperation({ summary: "GetMunicipalityLogo" })
  @ApiProduces("image/png", "image/jpeg", "image/webp")
  @ApiResponse({ status: 200, description: "Logo image" })
  async handle(
    @Param() path: SlugPathRequestDTO,
    @Res() response: Response,
  ): Promise<void> {
    const result = await this.operation.execute({ slug: path.slug });
    result.fold(
      (logo) => {
        // URLs carry ?v=<hash>, so a new upload changes the URL and the image can be cached.
        response
          .status(200)
          .type(logo.contentType)
          .setHeader("Cache-Control", "public, max-age=31536000, immutable")
          .setHeader("ETag", `"${logo.version}"`)
          .send(Buffer.from(logo.data));
      },
      (error) => {
        throw new ProblemException(404, error);
      },
    );
  }
}
