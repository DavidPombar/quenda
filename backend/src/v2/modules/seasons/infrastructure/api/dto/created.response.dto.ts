// SPDX-License-Identifier: AGPL-3.0-or-later
import { ApiProperty } from "@nestjs/swagger";
export class CreatedResponseDTO {
  @ApiProperty({ description: "UUID of the created record" }) id!: string;
}
