// SPDX-License-Identifier: AGPL-3.0-or-later
import { ApiProperty } from "@nestjs/swagger";
import { Matches } from "class-validator";
export class FeedTokenPathRequestDTO {
  @ApiProperty({ description: "Secret subscription token (64 hex digits)" })
  @Matches(/^[0-9a-f]{64}$/)
  token!: string;
}
