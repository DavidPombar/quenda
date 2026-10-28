// SPDX-License-Identifier: AGPL-3.0-or-later
import { Injectable } from "@nestjs/common";
import { OidcProvider } from "../../domain/oidc-provider";
import { Result } from "../../../../shared/application/result";
export interface AuthMethods {
  demo: boolean;
  oidc: { label: string } | null;
  email: boolean;
}
/** Sign-in methods enabled in this deployment, so frontends render only those. */
@Injectable()
export class GetAuthMethods {
  constructor(private readonly oidc: OidcProvider) {}
  async execute(
    _args: Record<string, never>,
  ): Promise<Result<AuthMethods, never>> {
    const label = this.oidc.label();
    return Result.ok({
      demo: process.env.DEMO_MODE === "true",
      oidc: this.oidc.enabled() && label ? { label } : null,
      email: false,
    });
  }
}
