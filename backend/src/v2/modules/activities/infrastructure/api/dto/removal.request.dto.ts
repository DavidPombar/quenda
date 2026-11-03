// SPDX-License-Identifier: AGPL-3.0-or-later
import { ApiProperty } from "@nestjs/swagger";
import { IsIn, IsString, MaxLength } from "class-validator";
export class RemovalRequestDTO {
  @ApiProperty({ enum: ["removed"] })
  @IsIn(["removed"])
  status!: "removed";
  @ApiProperty({ description: "Why the person is removed; they are told" })
  @IsString()
  @MaxLength(500)
  reason!: string;
}
