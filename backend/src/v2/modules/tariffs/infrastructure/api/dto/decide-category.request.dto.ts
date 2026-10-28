// SPDX-License-Identifier: AGPL-3.0-or-later
import { ApiProperty } from "@nestjs/swagger";
import { IsIn } from "class-validator";
export class DecideCategoryRequestDTO {
  @ApiProperty({
    enum: ["verified", "rejected"],
    description: "Verified also assigns a category nobody requested",
  })
  @IsIn(["verified", "rejected"])
  status!: "verified" | "rejected";
}
