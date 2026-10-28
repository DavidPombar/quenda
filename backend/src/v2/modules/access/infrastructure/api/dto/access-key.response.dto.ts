// SPDX-License-Identifier: AGPL-3.0-or-later
import { ApiProperty } from "@nestjs/swagger";
import { AccessKey } from "../../../domain/access.read-model";
export class AccessKeyResponseDTO {
  @ApiProperty({ description: "Key id (RFC 7638 thumbprint)" }) kid!: string;
  @ApiProperty({ description: "Instant the key was created" })
  createdAt!: string;
  @ApiProperty({
    description: "Instant it stopped signing new passes",
    type: String,
    nullable: true,
  })
  retiredAt!: string | null;
  static from(value: AccessKey): AccessKeyResponseDTO {
    return {
      kid: value.kid,
      createdAt: value.createdAt.toString(),
      retiredAt: value.retiredAt?.toString() ?? null,
    };
  }
}
