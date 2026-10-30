// SPDX-License-Identifier: AGPL-3.0-or-later
import { Body, HttpCode, Put, UseGuards } from "@nestjs/common";
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
  UploadMunicipalityIcon,
  UploadMunicipalityIconError,
} from "../../../application/commands/upload-municipality-icon.command";
@V2Controller("manager/municipality/icon")
@UseGuards(PrincipalGuard)
export class UploadMunicipalityIconController {
  private readonly operation;
  constructor(locator: Commands) {
    this.operation = locator.get(UploadMunicipalityIcon);
  }
  @Put()
  @HttpCode(204)
  @ApiOperation({ summary: "UploadMunicipalityIcon" })
  @ApiConsumes("image/png")
  @ApiBody({
    description: "Square 512 px PNG of at most 512 kB, drawn from the logo",
    schema: { type: "string", format: "binary" },
  })
  @ApiResponse({ status: 204, description: "Successful operation" })
  async handle(
    @CurrentPrincipal() principal: Principal,
    @Body() body: unknown,
  ): Promise<void> {
    // The raw parser only accepts the image types, so anything else arrives as a non-buffer.
    const result = await this.operation.execute({
      principal,
      data: Buffer.isBuffer(body) ? body : new Uint8Array(),
    });
    return result.fold(() => undefined, this.handleError);
  }
  private handleError(this: void, error: UploadMunicipalityIconError): never {
    switch (error.code) {
      case "forbidden":
        throw new ProblemException(403, error);
      case "unsupported_icon":
        throw new ProblemException(415, error);
      case "logo_required":
        throw new ProblemException(409, error);
      default:
        return assertNever(error);
    }
  }
}
