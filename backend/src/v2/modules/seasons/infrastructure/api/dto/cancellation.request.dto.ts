// SPDX-License-Identifier: AGPL-3.0-or-later
import { ApiProperty } from "@nestjs/swagger";
import { IsIn, IsString, MaxLength } from "class-validator";
export class CancellationRequestDTO {
  @ApiProperty({ enum: ["cancelled"] })
  @IsIn(["cancelled"])
  status!: "cancelled";
  @ApiProperty({ description: "Why it is withdrawn (journal)" })
  @IsString()
  @MaxLength(500)
  reason!: string;
}
