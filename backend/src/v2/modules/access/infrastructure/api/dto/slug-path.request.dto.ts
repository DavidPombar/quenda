// SPDX-License-Identifier: AGPL-3.0-or-later
import { ApiProperty } from "@nestjs/swagger";
import { IsString, Matches } from "class-validator";
export class SlugPathRequestDTO {
  @ApiProperty({ description: "Public municipality identifier" })
  @IsString()
  @Matches(/^[a-z0-9-]{1,80}$/)
  slug!: string;
}
