// SPDX-License-Identifier: AGPL-3.0-or-later
import { Get } from "@nestjs/common";
import { ApiOkResponse, ApiOperation, ApiProperty } from "@nestjs/swagger";
import { V2Controller } from "../../../../../shared/infrastructure/api/v2-controller.decorator";
import { Queries } from "../../../../../shared/infrastructure/queries.locator";
import { GetMapSettings } from "../../../application/queries/get-map-settings.query";
class MapSettingsResponseDTO {
  @ApiProperty({ description: "XYZ tile URL template" }) tileUrl!: string;
  @ApiProperty({ description: "Attribution shown on the map" })
  attribution!: string;
}
@V2Controller("public/map")
export class GetMapSettingsController {
  private readonly operation;
  constructor(queries: Queries) {
    this.operation = queries.get(GetMapSettings);
  }
  @Get()
  @ApiOperation({ summary: "Map tile server configured for this deployment" })
  @ApiOkResponse({ type: MapSettingsResponseDTO })
  async handle(): Promise<MapSettingsResponseDTO> {
    return (await this.operation.execute({})).fold(
      (value) => ({ tileUrl: value.tileUrl, attribution: value.attribution }),
      (error: never) => error,
    );
  }
}
