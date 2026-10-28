// SPDX-License-Identifier: AGPL-3.0-or-later
import { ApiProperty } from "@nestjs/swagger";
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
  static from(
    value: OperatorPrincipal | null,
  ): CurrentOperatorSessionResponseDTO {
    return { session: value ? OperatorSessionResponseDTO.from(value) : null };
  }
}
