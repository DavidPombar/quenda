// SPDX-License-Identifier: AGPL-3.0-or-later
import { ApiProperty } from "@nestjs/swagger";
import { PenaltyStanding } from "../../../domain/no-show-penalty";
export class PenaltyStandingResponseDTO {
  @ApiProperty({ description: "Whether the municipality applies the penalty" })
  enabled!: boolean;
  @ApiProperty({ description: "No-shows inside the window" }) count!: number;
  @ApiProperty({ description: "No-shows that trigger a block" }) limit!: number;
  @ApiProperty({ description: "Days in which no-shows count" })
  windowDays!: number;
  @ApiProperty({ description: "Days without booking once blocked" })
  blockDays!: number;
  @ApiProperty({ description: "No-shows still allowed before a block" })
  remaining!: number;
  @ApiProperty({
    type: String,
    nullable: true,
    description: "End of the block in force",
  })
  blockedUntil!: string | null;
  static from(value: PenaltyStanding): PenaltyStandingResponseDTO {
    return {
      ...value,
      blockedUntil: value.blockedUntil?.toString() ?? null,
    };
  }
}
