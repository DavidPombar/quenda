// SPDX-License-Identifier: AGPL-3.0-or-later
import { Body, Headers, Param, Post, Query, UseGuards } from "@nestjs/common";
import {
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
} from "@nestjs/swagger";
import { V2Controller } from "../../../../../shared/infrastructure/api/v2-controller.decorator";
import {
  PrincipalGuard,
  CurrentPrincipal,
} from "../../../../../shared/infrastructure/api/principal.guard";
import { Principal } from "../../../../../shared/application/principal";
import { ProblemException } from "../../../../../shared/infrastructure/api/problem";
import { Commands } from "../../../../../shared/infrastructure/commands.locator";
import { assertNever } from "../../../../../shared/application/errors";
import {
  AddFacilityPhoto,
  AddFacilityPhotoError,
} from "../../../application/commands/add-facility-photo.command";
import { IdPathRequestDTO } from "../dto/id-path.request.dto";
import { UploadPhotoRequestDTO } from "../dto/upload-photo.request.dto";
class CreatedPhotoResponseDTO {
  id!: string;
}
@V2Controller("manager/facilities")
@UseGuards(PrincipalGuard)
export class AddFacilityPhotoController {
  private readonly operation;
  constructor(locator: Commands) {
    this.operation = locator.get(AddFacilityPhoto);
  }
  @Post(":id/photos")
  @ApiOperation({ summary: "AddFacilityPhoto" })
  @ApiConsumes("image/png", "image/jpeg", "image/webp")
  @ApiBody({
    description: "PNG, JPEG or WebP image of at most 4 MB",
    schema: { type: "string", format: "binary" },
  })
  @ApiResponse({ status: 201, type: CreatedPhotoResponseDTO })
  async handle(
    @CurrentPrincipal() principal: Principal,
    @Param() path: IdPathRequestDTO,
    @Query() query: UploadPhotoRequestDTO,
    @Headers("content-type") contentType: string | undefined,
    @Body() body: unknown,
  ): Promise<CreatedPhotoResponseDTO> {
    // The raw parser only accepts the image types, so anything else arrives as a non-buffer.
    const result = await this.operation.execute({
      principal,
      facilityId: path.id,
      contentType: contentType?.split(";")[0].trim().toLowerCase() ?? "",
      data: Buffer.isBuffer(body) ? body : new Uint8Array(),
      alt: { gl: query.altGl, es: query.altEs },
    });
    return result.fold((value) => ({ id: value.id }), this.handleError);
  }
  private handleError(this: void, error: AddFacilityPhotoError): never {
    switch (error.code) {
      case "forbidden":
        throw new ProblemException(403, error);
      case "not_found":
        throw new ProblemException(404, error);
      case "validation":
        throw new ProblemException(400, error);
      case "unsupported_photo":
        throw new ProblemException(415, error);
      case "photo_too_large":
        throw new ProblemException(413, error);
      case "photo_limit":
        throw new ProblemException(409, error);
      default:
        return assertNever(error);
    }
  }
}
