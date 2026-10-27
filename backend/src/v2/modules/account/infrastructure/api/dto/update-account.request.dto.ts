// SPDX-License-Identifier: AGPL-3.0-or-later
import { ApiProperty } from "@nestjs/swagger";
import { IsIn } from "class-validator";
export class UpdateAccountRequestDTO {
  @ApiProperty({
    description: "Language for outgoing messages",
    enum: ["gl", "es"],
  })
  @IsIn(["gl", "es"])
  locale!: "gl" | "es";
}
