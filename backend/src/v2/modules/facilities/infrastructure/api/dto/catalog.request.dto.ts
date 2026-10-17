// SPDX-License-Identifier: AGPL-3.0-or-later
import { ApiProperty } from "@nestjs/swagger";
import { IsString, Matches } from "class-validator";

export class CatalogRequestDTO {
  @ApiProperty({ description: "Municipality slug" })
  @IsString()
  @Matches(/^[a-z0-9-]{1,64}$/)
  slug!: string;
}
