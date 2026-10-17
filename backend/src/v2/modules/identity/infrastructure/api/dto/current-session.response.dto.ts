// SPDX-License-Identifier: AGPL-3.0-or-later
import { ApiProperty } from "@nestjs/swagger";
import { Principal } from "../../../../../shared/application/principal";
import { SessionResponseDTO } from "./session.response.dto";
export class CurrentSessionResponseDTO {
  @ApiProperty({
    description: "Authenticated session, or null when signed out",
    type: SessionResponseDTO,
    nullable: true,
  })
  session!: SessionResponseDTO | null;
  static from(value: Principal | null): CurrentSessionResponseDTO {
    return { session: value ? SessionResponseDTO.from(value) : null };
  }
}
