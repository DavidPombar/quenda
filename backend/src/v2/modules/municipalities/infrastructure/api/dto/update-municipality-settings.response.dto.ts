// SPDX-License-Identifier: AGPL-3.0-or-later
import { ApiProperty } from "@nestjs/swagger";
import { MunicipalitySettingsResponseDTO } from "./municipality-settings.response.dto";
export class UpdateMunicipalitySettingsResponseDTO {
  @ApiProperty({ type: MunicipalitySettingsResponseDTO })
  settings!: MunicipalitySettingsResponseDTO;
  @ApiProperty({
    description:
      "Upcoming confirmed reservations on newly declared holidays; they are kept",
  })
  affectedBookings!: number;
}
