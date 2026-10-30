// SPDX-License-Identifier: AGPL-3.0-or-later
import { Get, Param, Res } from "@nestjs/common";
import { ApiOperation, ApiProduces, ApiResponse } from "@nestjs/swagger";
import type { Response } from "express";
import { V2Controller } from "../../../../../shared/infrastructure/api/v2-controller.decorator";
import { Queries } from "../../../../../shared/infrastructure/queries.locator";
import { ProblemException } from "../../../../../shared/infrastructure/api/problem";
import { GetFacilityPhoto } from "../../../application/queries/get-facility-photo.query";
import { PhotoPathRequestDTO } from "../dto/photo-path.request.dto";
@V2Controller("public/facilities")
export class GetFacilityPhotoController {
  private readonly operation;
  constructor(locator: Queries) {
    this.operation = locator.get(GetFacilityPhoto);
  }
  @Get(":id/photos/:photoId")
  @ApiOperation({ summary: "GetFacilityPhoto" })
  @ApiProduces("image/png", "image/jpeg", "image/webp")
  @ApiResponse({ status: 200, description: "Photo image" })
  async handle(
    @Param() path: PhotoPathRequestDTO,
    @Res() response: Response,
  ): Promise<void> {
    const result = await this.operation.execute({
      facilityId: path.id,
      photoId: path.photoId,
    });
    result.fold(
      (photo) => {
        // URLs carry ?v=<hash> and a photo never changes its bytes, so it can be cached.
        response
          .status(200)
          .type(photo.contentType)
          .setHeader("Cache-Control", "public, max-age=31536000, immutable")
          .setHeader("ETag", `"${photo.version}"`)
          .send(Buffer.from(photo.data));
      },
      (error) => {
        throw new ProblemException(404, error);
      },
    );
  }
}
