// SPDX-License-Identifier: AGPL-3.0-or-later
import { Body, HttpCode, Param, Patch, UseGuards } from "@nestjs/common";
import { ApiOperation, ApiResponse } from "@nestjs/swagger";
import { V2Controller } from "../../../../../shared/infrastructure/api/v2-controller.decorator";
import {
  PrincipalGuard,
  CurrentPrincipal,
} from "../../../../../shared/infrastructure/api/principal.guard";
import { Principal } from "../../../../../shared/application/principal";
import { ProblemException } from "../../../../../shared/infrastructure/api/problem";
import { Commands } from "../../../../../shared/infrastructure/commands.locator";
import {
  AppError,
  assertNever,
} from "../../../../../shared/application/errors";
import { UpdateFacilityPhoto } from "../../../application/commands/update-facility-photo.command";
import { PhotoPathRequestDTO } from "../dto/photo-path.request.dto";
import { UpdatePhotoRequestDTO } from "../dto/update-photo.request.dto";
@V2Controller("manager/facilities")
@UseGuards(PrincipalGuard)
export class UpdateFacilityPhotoController {
  private readonly operation;
  constructor(locator: Commands) {
    this.operation = locator.get(UpdateFacilityPhoto);
  }
  @Patch(":id/photos/:photoId")
  @HttpCode(204)
  @ApiOperation({ summary: "Changes a photo's alternative text or position" })
  @ApiResponse({ status: 204, description: "Successful operation" })
  async handle(
    @CurrentPrincipal() principal: Principal,
    @Param() path: PhotoPathRequestDTO,
    @Body() body: UpdatePhotoRequestDTO,
  ): Promise<void> {
    const result = await this.operation.execute({
      principal,
      facilityId: path.id,
      photoId: path.photoId,
      alt: body.alt,
      position: body.position,
    });
    return result.fold(() => undefined, this.handleError);
  }
  private handleError(
    this: void,
    error:
      AppError<"forbidden"> | AppError<"not_found"> | AppError<"validation">,
  ): never {
    switch (error.code) {
      case "forbidden":
        throw new ProblemException(403, error);
      case "not_found":
        throw new ProblemException(404, error);
      case "validation":
        throw new ProblemException(400, error);
      default:
        return assertNever(error);
    }
  }
}
