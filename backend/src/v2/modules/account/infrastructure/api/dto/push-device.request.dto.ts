// SPDX-License-Identifier: AGPL-3.0-or-later
import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  IsObject,
  IsString,
  Matches,
  MaxLength,
  ValidateNested,
} from "class-validator";
export class PushKeysRequestDTO {
  @ApiProperty({ description: "Browser public key (P-256, base64url)" })
  @IsString()
  @Matches(/^[A-Za-z0-9_-]{80,200}$/)
  p256dh!: string;
  @ApiProperty({ description: "Authentication secret (base64url)" })
  @IsString()
  @Matches(/^[A-Za-z0-9_-]{16,100}$/)
  auth!: string;
}
/** The PushSubscription JSON a browser returns from pushManager.subscribe(). */
export class PushDeviceRequestDTO {
  @ApiProperty({ description: "Push service endpoint of the browser" })
  @IsString()
  @MaxLength(1000)
  endpoint!: string;
  @ApiProperty({ type: PushKeysRequestDTO })
  @IsObject()
  @ValidateNested()
  @Type(() => PushKeysRequestDTO)
  keys!: PushKeysRequestDTO;
}
