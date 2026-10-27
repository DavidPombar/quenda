// SPDX-License-Identifier: AGPL-3.0-or-later
import { ApiProperty } from "@nestjs/swagger";
import { AccessPass } from "../../../domain/access.read-model";
export class AccessPassResponseDTO {
  @ApiProperty({
    description:
      "ES256 JWT (iss municipality, sub reservation, fac facility, nbf/exp window) for the QR code",
  })
  token!: string;
  @ApiProperty({ description: "Short code to read out at the desk" })
  code!: string;
  @ApiProperty({ description: "First instant the pass opens the door" })
  validFrom!: string;
  @ApiProperty({ description: "Instant the pass stops working" })
  validUntil!: string;
  static from(value: AccessPass): AccessPassResponseDTO {
    return {
      token: value.token,
      code: value.code,
      validFrom: value.validFrom.toString(),
      validUntil: value.validUntil.toString(),
    };
  }
}
