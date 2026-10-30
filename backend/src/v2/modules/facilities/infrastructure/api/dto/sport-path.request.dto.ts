// SPDX-License-Identifier: AGPL-3.0-or-later
import { ApiProperty } from "@nestjs/swagger";
import { Matches } from "class-validator";
import { SPORT_CODE } from "../../../domain/sport.repository";
export class SportPathRequestDTO {
  @ApiProperty({ description: "Sport code" })
  @Matches(SPORT_CODE)
  code!: string;
}
