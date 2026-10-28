// SPDX-License-Identifier: AGPL-3.0-or-later
import { ApiProperty } from "@nestjs/swagger";
import { ExportedIdentity } from "../../../domain/account.read-model";
export class ExportedIdentityResponseDTO {
  @ApiProperty({ description: "Identity provider (OIDC issuer)" })
  issuer!: string;
  @ApiProperty({ description: "Identifier of the person at that provider" })
  subject!: string;
  @ApiProperty({ description: "Instant the identity was linked" })
  createdAt!: string;
  static from(value: ExportedIdentity): ExportedIdentityResponseDTO {
    return {
      issuer: value.issuer,
      subject: value.subject,
      createdAt: value.createdAt.toString(),
    };
  }
}
