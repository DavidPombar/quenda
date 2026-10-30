// SPDX-License-Identifier: AGPL-3.0-or-later
import { ApiProperty } from "@nestjs/swagger";
import { Sport } from "../../../domain/sport.entity";
import { LocalizedTextResponseDTO } from "./localized-text.response.dto";
export class SportResponseDTO {
  @ApiProperty({ description: "Stable sport code" }) code!: string;
  @ApiProperty({ type: LocalizedTextResponseDTO })
  name!: LocalizedTextResponseDTO;
  @ApiProperty({ description: "CNID group of conventional spaces" })
  cnidClass!: string;
  @ApiProperty({ description: "CNID space type" }) cnidType!: string;
  @ApiProperty({ description: "schema.org type" }) schemaType!: string;
  @ApiProperty({ description: "Not offered in filters or for new facilities" })
  hidden!: boolean;
  @ApiProperty({ description: "Display order" }) position!: number;
  static from(value: Sport): SportResponseDTO {
    return {
      code: value.code,
      name: { gl: value.name.gl, es: value.name.es },
      cnidClass: value.cnidClass,
      cnidType: value.cnidType,
      schemaType: value.schemaType,
      hidden: value.hidden,
      position: value.position,
    };
  }
}
