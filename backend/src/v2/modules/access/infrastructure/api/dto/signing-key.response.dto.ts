// SPDX-License-Identifier: AGPL-3.0-or-later
import { createHash } from "node:crypto";
import { ApiProperty } from "@nestjs/swagger";
import { PublicSigningKey } from "../../../domain/credential-keys";
/** An OKP public JWK (RFC 8037) plus what people need to recognise it. */
export class SigningKeyResponseDTO {
  @ApiProperty({ enum: ["OKP"] }) kty!: "OKP";
  @ApiProperty({ enum: ["Ed25519"] }) crv!: "Ed25519";
  @ApiProperty({ enum: ["EdDSA"] }) alg!: "EdDSA";
  @ApiProperty({ description: "Key id, matches the JWS kid" }) kid!: string;
  @ApiProperty({ description: "Raw public key, base64url" }) x!: string;
  @ApiProperty({
    description: "SHA-256 of the public key, first 16 hex digits",
  })
  fingerprint!: string;
  @ApiProperty({ description: "Creation time (ISO 8601)" }) createdAt!: string;
  static from(value: PublicSigningKey): SigningKeyResponseDTO {
    return {
      kty: "OKP",
      crv: "Ed25519",
      alg: "EdDSA",
      kid: value.id,
      x: value.x,
      fingerprint: createHash("sha256")
        .update(Buffer.from(value.x, "base64url"))
        .digest("hex")
        .slice(0, 16)
        .replace(/(.{4})(?!$)/g, "$1:"),
      createdAt: value.createdAt.toString(),
    };
  }
}
