// SPDX-License-Identifier: AGPL-3.0-or-later
import { ApiProperty } from "@nestjs/swagger";
import { IsIn, IsString, Matches, MaxLength } from "class-validator";
export class PageViewRequestDTO {
  @ApiProperty({ description: "Municipality slug" })
  @IsString()
  @Matches(/^[a-z0-9-]{1,64}$/)
  slug!: string;
  @ApiProperty({ description: "Path of the page; the query string is dropped" })
  @IsString()
  @MaxLength(500)
  path!: string;
  @ApiProperty({ enum: ["gl", "es"] })
  @IsIn(["gl", "es"])
  language!: string;
  @ApiProperty({ description: "Screen size, e.g. 390x844" })
  @Matches(/^\d{2,5}x\d{2,5}$/)
  screen!: string;
}
