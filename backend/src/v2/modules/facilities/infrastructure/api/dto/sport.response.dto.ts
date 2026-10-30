// SPDX-License-Identifier: AGPL-3.0-or-later
import { ApiProperty } from "@nestjs/swagger";
import { Sport, SportName } from "../../../domain/sport.entity";
export const SPORT_ARTS = ["padel", "tennis", "futsal", "swimming", "generic"];
export class SportNameDTO {
  @ApiProperty({ description: "Name in Galician" }) gl!: string;
  @ApiProperty({ description: "Name in Spanish" }) es!: string;
  static from(value: SportName): SportNameDTO {
    return { gl: value.gl, es: value.es };
  }
}
export class SportResponseDTO {
  @ApiProperty({ description: "Stable code used by facilities and filters" })
  code!: string;
  @ApiProperty({ type: SportNameDTO }) name!: SportNameDTO;
  @ApiProperty({ description: "CNID group of conventional sports spaces" })
  cnidClass!: string;
  @ApiProperty({ description: "CNID sports space type" }) cnidType!: string;
  @ApiProperty({ description: "schema.org type of its facilities" })
  schemaType!: string;
  @ApiProperty({ enum: SPORT_ARTS, description: "Illustration and colour" })
  art!: Sport["art"];
  @ApiProperty({ description: "Offered for new facilities and as a filter" })
  visible!: boolean;
  @ApiProperty({ description: "Display order" }) position!: number;
  static from(value: Sport): SportResponseDTO {
    return {
      code: value.code,
      name: { gl: value.nameGl, es: value.nameEs },
      cnidClass: value.cnidClass,
      cnidType: value.cnidType,
      schemaType: value.schemaType,
      art: value.art,
      visible: value.visible,
      position: value.position,
    };
  }
}
