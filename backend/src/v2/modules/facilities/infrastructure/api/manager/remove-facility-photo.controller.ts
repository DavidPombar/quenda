// SPDX-License-Identifier: AGPL-3.0-or-later
import { Delete, HttpCode, Param, UseGuards } from "@nestjs/common";
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
import { RemoveFacilityPhoto } from "../../../application/commands/remove-facility-photo.command";
import { PhotoPathRequestDTO } from "../dto/photo-path.request.dto";
@V2Controller("manager/facilities")
@UseGuards(PrincipalGuard)
export class RemoveFacilityPhotoController {
  private readonly operation;
  constructor(locator: Commands) {
    this.operation = locator.get(RemoveFacilityPhoto);
  }
  @Delete(":id/photos/:photoId")
  @HttpCode(204)
  @ApiOperation({ summary: "RemoveFacilityPhoto" })
  @ApiResponse({ status: 204, description: "Successful operation" })
  async handle(
    @CurrentPrincipal() principal: Principal,
    @Param() path: PhotoPathRequestDTO,
  ): Promise<void> {
    const result = await this.operation.execute({
      principal,
      facilityId: path.id,
      photoId: path.photoId,
    });
    return result.fold(() => undefined, this.handleError);
  }
  private handleError(
    this: void,
    error: AppError<"forbidden"> | AppError<"not_found">,
  ): never {
    switch (error.code) {
      case "forbidden":
        throw new ProblemException(403, error);
      case "not_found":
        throw new ProblemException(404, error);
      default:
        return assertNever(error);
    }
  }
}
