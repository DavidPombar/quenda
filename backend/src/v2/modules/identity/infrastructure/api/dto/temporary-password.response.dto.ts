// SPDX-License-Identifier: AGPL-3.0-or-later
import { ApiProperty } from "@nestjs/swagger";
export class TemporaryPasswordResponseDTO {
  @ApiProperty({ description: "Login of the account" }) login!: string;
  @ApiProperty({
    description: "Shown once; the person replaces it at the first sign-in",
  })
  temporaryPassword!: string;
}
