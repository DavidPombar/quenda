// SPDX-License-Identifier: AGPL-3.0-or-later
import { ApiProperty } from "@nestjs/swagger";
import type { Temporal } from "@js-temporal/polyfill";
import { Principal } from "../../../../../shared/application/principal";
import { SessionResponseDTO } from "./session.response.dto";
export class CurrentSessionResponseDTO {
  @ApiProperty({
    description: "Authenticated session, or null when signed out",
    type: SessionResponseDTO,
    nullable: true,
  })
  session!: SessionResponseDTO | null;
  @ApiProperty({
    description:
      "When the session ends (ISO 8601 instant), so the app can offer to extend it in time",
    nullable: true,
  })
  expiresAt!: string | null;
  static from(value: {
    principal: Principal | null;
    expiresAt: Temporal.Instant | null;
  }): CurrentSessionResponseDTO {
    return {
      session: value.principal
        ? SessionResponseDTO.from(value.principal)
        : null,
      expiresAt: value.principal ? (value.expiresAt?.toString() ?? null) : null,
    };
  }
}
