// SPDX-License-Identifier: AGPL-3.0-or-later
import { ApiProperty } from "@nestjs/swagger";
import { DeploymentMunicipality } from "../../../application/queries/list-deployment.query";
import { MunicipalitySettingsResponseDTO } from "../../../../municipalities/infrastructure/api/dto/municipality-settings.response.dto";
import { StaffMemberResponseDTO } from "./staff-member.response.dto";
export class DeploymentMunicipalityResponseDTO {
  @ApiProperty({ type: MunicipalitySettingsResponseDTO })
  settings!: MunicipalitySettingsResponseDTO;
  @ApiProperty({ description: "Facilities in any status" }) facilities!: number;
  @ApiProperty({ description: "Facilities currently active" })
  activeFacilities!: number;
  @ApiProperty({ type: [StaffMemberResponseDTO] })
  managers!: StaffMemberResponseDTO[];
  static from(
    value: DeploymentMunicipality,
  ): DeploymentMunicipalityResponseDTO {
    return {
      settings: MunicipalitySettingsResponseDTO.fromSettings(value.settings),
      facilities: value.facilities,
      activeFacilities: value.activeFacilities,
      managers: value.managers.map(StaffMemberResponseDTO.from),
    };
  }
}
