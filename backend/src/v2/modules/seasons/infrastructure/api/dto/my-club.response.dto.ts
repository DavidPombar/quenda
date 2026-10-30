// SPDX-License-Identifier: AGPL-3.0-or-later
import { ApiProperty } from "@nestjs/swagger";
import type { MyClub, Sport } from "../../../domain/season.read-model";
export class ClubResponseDTO {
  @ApiProperty() id!: string;
  @ApiProperty() name!: string;
  @ApiProperty({
    nullable: true,
  })
  sport!: Sport | null;
}
export class ClubOccurrenceResponseDTO {
  @ApiProperty() id!: string;
  @ApiProperty() facilityName!: string;
  @ApiProperty() resourceName!: string;
  @ApiProperty() start!: string;
  @ApiProperty() end!: string;
}
export class MyClubResponseDTO {
  @ApiProperty({ type: ClubResponseDTO, nullable: true })
  organization!: ClubResponseDTO | null;
  @ApiProperty({ type: [ClubOccurrenceResponseDTO] })
  occurrences!: ClubOccurrenceResponseDTO[];
  static from(value: MyClub): MyClubResponseDTO {
    return {
      organization: value.organization ? { ...value.organization } : null,
      occurrences: value.occurrences.map((item) => ({
        ...item,
        start: item.start.toString(),
        end: item.end.toString(),
      })),
    };
  }
}
