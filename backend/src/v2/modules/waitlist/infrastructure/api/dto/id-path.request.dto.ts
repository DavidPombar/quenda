// SPDX-License-Identifier: AGPL-3.0-or-later
import { ApiProperty } from "@nestjs/swagger";
import { IsUUID } from "class-validator";

export class IdPathRequestDTO {
  @ApiProperty({ description: "Waiting-list entry UUID" })
  @IsUUID()
  id!: string;
}
