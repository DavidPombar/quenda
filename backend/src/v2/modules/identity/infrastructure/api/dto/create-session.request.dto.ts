// SPDX-License-Identifier: AGPL-3.0-or-later
import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsIn, Matches } from "class-validator";

export class CreateSessionRequestDTO {
  @ApiProperty({ description: "Municipality slug" })
  @IsString()
  @Matches(/^[a-z0-9-]{1,64}$/)
  slug!: string;
  @ApiProperty({
    description: "Demo account to use; unavailable unless DEMO_MODE=true",
  })
  @IsIn(["citizen", "manager"])
  role!: "citizen" | "manager";
}
