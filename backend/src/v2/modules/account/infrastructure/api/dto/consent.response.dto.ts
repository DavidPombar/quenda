// SPDX-License-Identifier: AGPL-3.0-or-later
import { ApiProperty } from "@nestjs/swagger";
import { ConsentRecord } from "../../../domain/account.read-model";
export class ConsentResponseDTO {
  @ApiProperty({ description: "Accepted privacy notice version" })
  legalVersion!: string;
  @ApiProperty({ description: "Acceptance instant" }) acceptedAt!: string;
  static from(value: ConsentRecord): ConsentResponseDTO {
    return {
      legalVersion: value.legalVersion,
      acceptedAt: value.acceptedAt.toString(),
    };
  }
}
