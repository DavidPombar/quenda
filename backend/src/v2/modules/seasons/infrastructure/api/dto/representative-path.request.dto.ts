// SPDX-License-Identifier: AGPL-3.0-or-later
import { ApiProperty } from "@nestjs/swagger";
import { IsUUID } from "class-validator";
export class RepresentativePathRequestDTO {
  @ApiProperty({ description: "Organization UUID" })
  @IsUUID()
  id!: string;
  @ApiProperty({ description: "Representative user UUID" })
  @IsUUID()
  userId!: string;
}
