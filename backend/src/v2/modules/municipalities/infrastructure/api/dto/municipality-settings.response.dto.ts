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
    description: "Whether the council switched web analytics on (#57)",
  })
  analyticsEnabled!: boolean;
  @ApiProperty({
    description: "Whether the deployment has an Umami to count the app in",
  })
  analyticsAvailable!: boolean;
  static fromSettings(
    value: MunicipalitySettings,
    collects = false,
  ): MunicipalitySettingsResponseDTO {
    return {
      ...MunicipalityResponseDTO.from(value, collects),
      holidaysCalendar: value.holidaysCalendar,
      analyticsEnabled: value.analyticsEnabled,
      analyticsAvailable: collects,
    };
  }
}
