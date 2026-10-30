// SPDX-License-Identifier: AGPL-3.0-or-later
import { Get, Param, Res } from "@nestjs/common";
import { ApiOperation, ApiProduces, ApiResponse } from "@nestjs/swagger";
import type { Response } from "express";
import { IsString, Matches } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";
import { V2Controller } from "../../../../../shared/infrastructure/api/v2-controller.decorator";
import { Queries } from "../../../../../shared/infrastructure/queries.locator";
import { ProblemException } from "../../../../../shared/infrastructure/api/problem";
import { GetAppManifest } from "../../../application/queries/get-app-manifest.query";
class SlugPathRequestDTO {
  @ApiProperty({ description: "Public municipality identifier" })
  @IsString()
  @Matches(/^[a-z0-9-]{1,80}$/)
  slug!: string;
}
@V2Controller("public/municipalities")
export class GetAppManifestController {
  private readonly operation;
  constructor(locator: Queries) {
    this.operation = locator.get(GetAppManifest);
  }
  @Get(":slug/manifest")
  @ApiOperation({ summary: "GetAppManifest" })
  @ApiProduces("application/manifest+json")
  @ApiResponse({
    status: 200,
    description:
      "Web app manifest with the council's name, colour and icon (#24)",
  })
  async handle(
    @Param() path: SlugPathRequestDTO,
    @Res() response: Response,
  ): Promise<void> {
    const result = await this.operation.execute({ slug: path.slug });
    result.fold(
      (manifest) => {
        // Revalidated on each install, so a new colour or icon reaches the next one.
        response
          .status(200)
          .type("application/manifest+json")
          .setHeader("Cache-Control", "no-cache")
          .send(JSON.stringify(manifest));
      },
      (error) => {
        throw new ProblemException(404, error);
      },
    );
  }
}
