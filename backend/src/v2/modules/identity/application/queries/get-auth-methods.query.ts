// SPDX-License-Identifier: AGPL-3.0-or-later
import { Injectable } from "@nestjs/common";
import { OidcProvider } from "../../domain/oidc-provider";
import { Result } from "../../../../shared/application/result";
import { emailLoginEnabled } from "../email-login";
import { DataProtector } from "../../../../shared/application/data-protector";
export interface AuthMethods {
  demo: boolean;
  oidc: { label: string } | null;
  email: boolean;
  /** Staff accounts with password and second factor (#8); they need the data key. */
  local: boolean;
}
/** Sign-in methods enabled in this deployment, so frontends render only those. */
@Injectable()
export class GetAuthMethods {
  constructor(
    private readonly oidc: OidcProvider,
    private readonly protector: DataProtector,
  ) {}
  async execute(
    _args: Record<string, never>,
  ): Promise<Result<AuthMethods, never>> {
    const label = this.oidc.label();
    return Result.ok({
      demo: process.env.DEMO_MODE === "true",
      oidc: this.oidc.enabled() && label ? { label } : null,
      // Codes need a mail server; the demo sends them to the local Mailpit.
      email:
        emailLoginEnabled() &&
        (Boolean(process.env.SMTP_URL) || process.env.DEMO_MODE === "true"),
      local: this.protector.available(),
    });
  }
}
