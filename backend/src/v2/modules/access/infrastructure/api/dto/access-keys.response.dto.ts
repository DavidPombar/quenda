// SPDX-License-Identifier: AGPL-3.0-or-later
import { ApiProperty } from "@nestjs/swagger";
import { PublicSigningKey } from "../../../domain/credential-keys";
import { SigningKeyResponseDTO } from "./signing-key.response.dto";
export class AccessKeysResponseDTO {
  @ApiProperty({ description: "Expected iss claim: the municipality slug" })
  issuer!: string;
  @ApiProperty({ description: "IANA time zone of the municipality" })
  timezone!: string;
  @ApiProperty({ type: SigningKeyResponseDTO, isArray: true })
  keys!: SigningKeyResponseDTO[];
  static from(value: {
    issuer: string;
    timezone: string;
    keys: PublicSigningKey[];
  }): AccessKeysResponseDTO {
    return {
      issuer: value.issuer,
      timezone: value.timezone,
      keys: value.keys.map(SigningKeyResponseDTO.from),
    };
  }
}
