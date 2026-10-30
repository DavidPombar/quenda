// SPDX-License-Identifier: AGPL-3.0-or-later
import { ApiProperty } from "@nestjs/swagger";
export class LocalizedTextResponseDTO {
  @ApiProperty({ description: "Galician" }) gl!: string;
  @ApiProperty({ description: "Spanish; empty means use the Galician text" })
  es!: string;
}
