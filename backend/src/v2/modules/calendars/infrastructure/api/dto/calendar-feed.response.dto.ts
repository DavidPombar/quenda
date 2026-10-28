// SPDX-License-Identifier: AGPL-3.0-or-later
import { ApiProperty } from "@nestjs/swagger";
import type { Temporal } from "@js-temporal/polyfill";
export class CalendarFeedResponseDTO {
  @ApiProperty({ description: "Whether a subscription link exists" })
  active!: boolean;
  @ApiProperty({
    description: "Instant the current link was issued",
    type: String,
    nullable: true,
  })
  createdAt!: string | null;
  static from(value: {
    createdAt: Temporal.Instant | null;
  }): CalendarFeedResponseDTO {
    return {
      active: value.createdAt !== null,
      createdAt: value.createdAt?.toString() ?? null,
    };
  }
}
