// SPDX-License-Identifier: AGPL-3.0-or-later
import { ApiProperty } from "@nestjs/swagger";
import { AccessKey } from "../../../domain/access.read-model";
/** RFC 7517 JSON Web Key Set. */
export class JwksResponseDTO {
  @ApiProperty({
    description: "Public EC P-256 keys (kty, crv, x, y, kid, alg, use)",
    type: Object,
    isArray: true,
  })
  keys!: Record<string, string>[];
  static from(value: AccessKey[]): JwksResponseDTO {
    return { keys: value.map((key) => key.publicJwk) };
  }
}
