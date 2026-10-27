// SPDX-License-Identifier: AGPL-3.0-or-later
import { ApiProperty } from "@nestjs/swagger";
import { IssuedCredential } from "../../../application/credential-issuer";
export class CredentialResponseDTO {
  @ApiProperty({
    description:
      "Compact JWS (EdDSA) to render as a QR code; its claims are iss, sub, fac, nbf and exp",
  })
  token!: string;
  @ApiProperty({ description: "Signing key id (JWS kid)" }) keyId!: string;
  @ApiProperty({
    description: "Valid from (ISO 8601): the space opens that day",
  })
  notBefore!: string;
  @ApiProperty({ description: "Valid until (ISO 8601): the booking ends" })
  expiresAt!: string;
  static from(value: IssuedCredential): CredentialResponseDTO {
    return {
      token: value.token,
      keyId: value.keyId,
      notBefore: value.notBefore.toString(),
      expiresAt: value.expiresAt.toString(),
    };
  }
}
