// SPDX-License-Identifier: AGPL-3.0-or-later
import { ApiProperty } from "@nestjs/swagger";
import { ExportedBlock } from "../../../domain/account.read-model";
export class ExportedBlockResponseDTO {
  @ApiProperty({ description: "Start of the booking ban" }) start!: string;
  @ApiProperty({ description: "End of the booking ban" }) end!: string;
  @ApiProperty({
    type: String,
    nullable: true,
    description: "When the municipality lifted it after a correction",
  })
  liftedAt!: string | null;
  static from(value: ExportedBlock): ExportedBlockResponseDTO {
    return {
      start: value.start.toString(),
      end: value.end.toString(),
      liftedAt: value.liftedAt?.toString() ?? null,
    };
  }
}
