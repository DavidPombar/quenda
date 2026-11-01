// SPDX-License-Identifier: AGPL-3.0-or-later
import { ApiProperty } from "@nestjs/swagger";
import type { Temporal } from "@js-temporal/polyfill";
import { OperatorPrincipal } from "../../../../../shared/application/operator-principal";
export class OperatorSessionResponseDTO {
  @ApiProperty({ description: "Operator UUID" }) operatorId!: string;
  @ApiProperty({ description: "Display name" }) displayName!: string;
  static from(value: OperatorPrincipal): OperatorSessionResponseDTO {
    return { operatorId: value.operatorId, displayName: value.displayName };
  }
}
export class CurrentOperatorSessionResponseDTO {
  @ApiProperty({
    type: OperatorSessionResponseDTO,
    nullable: true,
    description: "Operator session, or null when signed out",
  })
  session!: OperatorSessionResponseDTO | null;
  @ApiProperty({
    description:
      "When the session ends (ISO 8601 instant), so the backoffice can offer to extend it in time",
    nullable: true,
  })
  expiresAt!: string | null;
  static from(value: {
    principal: OperatorPrincipal | null;
    expiresAt: Temporal.Instant | null;
  }): CurrentOperatorSessionResponseDTO {
    return {
      session: value.principal
        ? OperatorSessionResponseDTO.from(value.principal)
        : null,
      expiresAt: value.principal ? (value.expiresAt?.toString() ?? null) : null,
    };
  }
}
export class OperatorSessionExpiryResponseDTO {
  @ApiProperty({ description: "When the session ends (ISO 8601 instant)" })
  expiresAt!: string;
}
