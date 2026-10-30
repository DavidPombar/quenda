// SPDX-License-Identifier: AGPL-3.0-or-later
import { ApiProperty } from "@nestjs/swagger";
import { AuthMethods } from "../../../application/queries/get-auth-methods.query";
import { OidcMethodResponseDTO } from "./oidc-method.response.dto";
export class AuthMethodsResponseDTO {
  @ApiProperty({
    description: "One-click synthetic demo accounts (DEMO_MODE=true)",
  })
  demo!: boolean;
  @ApiProperty({
    description: "Electronic identification through OpenID Connect, or null",
    type: OidcMethodResponseDTO,
    nullable: true,
  })
  oidc!: OidcMethodResponseDTO | null;
  @ApiProperty({ description: "Sign-in with an e-mailed code" })
  email!: boolean;
  @ApiProperty({
    description:
      "Staff sign-in with password and second factor (needs QUENDA_DATA_KEY)",
  })
  local!: boolean;
  static from(value: AuthMethods): AuthMethodsResponseDTO {
    return {
      demo: value.demo,
      oidc: value.oidc ? OidcMethodResponseDTO.from(value.oidc) : null,
      email: value.email,
      local: value.local,
    };
  }
}
