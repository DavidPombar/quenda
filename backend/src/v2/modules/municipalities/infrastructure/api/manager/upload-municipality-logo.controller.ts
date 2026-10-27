// SPDX-License-Identifier: AGPL-3.0-or-later
import { Body, Headers, HttpCode, Put, UseGuards } from "@nestjs/common";
import {
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
} from "@nestjs/swagger";
import { V2Controller } from "../../../../../shared/infrastructure/api/v2-controller.decorator";
import { Commands } from "../../../../../shared/infrastructure/commands.locator";
import {
  PrincipalGuard,
  CurrentPrincipal,
} from "../../../../../shared/infrastructure/api/principal.guard";
import { Principal } from "../../../../../shared/application/principal";
import { ProblemException } from "../../../../../shared/infrastructure/api/problem";
import { assertNever } from "../../../../../shared/application/errors";
import {
  UploadMunicipalityLogo,
  UploadMunicipalityLogoError,
} from "../../../application/commands/upload-municipality-logo.command";
@V2Controller("manager/municipality/logo")
@UseGuards(PrincipalGuard)
export class UploadMunicipalityLogoController {
  private readonly operation;
  constructor(locator: Commands) {
    this.operation = locator.get(UploadMunicipalityLogo);
  }
  @Put()
  @HttpCode(204)
  @ApiOperation({ summary: "UploadMunicipalityLogo" })
  @ApiConsumes("image/png", "image/jpeg", "image/webp")
  @ApiBody({
    description: "PNG, JPEG or WebP image of at most 2 MB",
    schema: { type: "string", format: "binary" },
  })
  @ApiResponse({ status: 204, description: "Successful operation" })
  async handle(
    @CurrentPrincipal() principal: Principal,
    @Headers("content-type") contentType: string | undefined,
    @Body() body: unknown,
  ): Promise<void> {
    // The raw parser only accepts the image types, so anything else arrives as a non-buffer.
    const result = await this.operation.execute({
      principal,
      contentType: contentType?.split(";")[0].trim().toLowerCase() ?? "",
      data: Buffer.isBuffer(body) ? body : new Uint8Array(),
    });
    return result.fold(() => undefined, this.handleError);
  }
  private handleError(this: void, error: UploadMunicipalityLogoError): never {
    switch (error.code) {
      case "forbidden":
        throw new ProblemException(403, error);
      case "unsupported_logo":
        throw new ProblemException(415, error);
      case "logo_too_large":
        throw new ProblemException(413, error);
      default:
        return assertNever(error);
    }
  }
}
