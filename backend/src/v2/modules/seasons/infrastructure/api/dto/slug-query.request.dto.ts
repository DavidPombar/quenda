// SPDX-License-Identifier: AGPL-3.0-or-later
import { ApiProperty } from "@nestjs/swagger";
import { Matches } from "class-validator";
export class SlugQueryRequestDTO {
  @ApiProperty({ description: "Public municipality identifier" })
  @Matches(/^[a-z0-9-]{1,80}$/)
  slug!: string;
}
