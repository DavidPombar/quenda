// SPDX-License-Identifier: AGPL-3.0-or-later
import { ApiProperty } from "@nestjs/swagger";
export class OidcMethodResponseDTO {
  @ApiProperty({
    description: "Button label configured with OIDC_LABEL",
    example: "Cl@ve",
  })
  label!: string;
  static from(value: { label: string }): OidcMethodResponseDTO {
    return { label: value.label };
  }
}
