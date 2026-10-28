// SPDX-License-Identifier: AGPL-3.0-or-later
import { ApiProperty } from "@nestjs/swagger";
import type { Temporal } from "@js-temporal/polyfill";
export class CalendarFeedLinkResponseDTO {
  @ApiProperty({
    description:
      "Same-origin path of the RFC 5545 subscription feed. It contains the secret token and is returned only once.",
  })
  path!: string;
  @ApiProperty({ description: "Instant the link was issued" })
  createdAt!: string;
  static from(value: {
    token: string;
    createdAt: Temporal.Instant;
  }): CalendarFeedLinkResponseDTO {
    return {
      path: `/v2/public/calendar-feeds/${value.token}.ics`,
      createdAt: value.createdAt.toString(),
    };
  }
}
