// SPDX-License-Identifier: AGPL-3.0-or-later
import { ApiProperty } from "@nestjs/swagger";
import { MunicipalitySettings } from "../../../../../shared/application/municipality-settings";
import { MunicipalityResponseDTO } from "./municipality.response.dto";
export class MunicipalitySettingsResponseDTO extends MunicipalityResponseDTO {
  @ApiProperty({
    description:
      "RFC 5545 VCALENDAR of all-day municipal holidays inherited by facilities",
  })
  holidaysCalendar!: string;
  @ApiProperty({
    description: "Base URL of the council's Umami; empty when off",
  })
  analyticsUrl!: string;
  @ApiProperty({
    type: String,
    nullable: true,
    description: "Umami website id",
  })
  analyticsWebsiteId!: string | null;
  static fromSettings(
    value: MunicipalitySettings,
  ): MunicipalitySettingsResponseDTO {
    return {
      ...MunicipalityResponseDTO.from(value),
      holidaysCalendar: value.holidaysCalendar,
      analyticsUrl: value.analyticsUrl,
      analyticsWebsiteId: value.analyticsWebsiteId,
    };
  }
}
